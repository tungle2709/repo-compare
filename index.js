#!/usr/bin/env node --max-old-space-size=4096

const { program } = require('commander');
const axios = require('axios');
const chalk = require('chalk');
const ora = require('ora');

class RepoComparer {
  constructor() {
    // Removed GitHub token requirement
  }

  parseGitHubUrl(input) {
    // Handle both URL formats and owner/repo format
    if (input.includes('github.com')) {
      const match = input.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/);
      if (match) {
        return { owner: match[1], repo: match[2] };
      }
    } else if (input.includes('/')) {
      const [owner, repo] = input.split('/');
      return { owner, repo };
    }
    throw new Error(`Invalid GitHub repository format: ${input}`);
  }

  async getRepoFiles(owner, repo) {
    const spinner = ora(`Fetching files from ${owner}/${repo}`).start();
    try {
      const response = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`
      );
      
      const files = response.data.tree.filter(item => 
        item.type === 'blob' && 
        /\.(js|ts|py|java|cpp|c|h|cs|php|rb|go|rs)$/i.test(item.path) &&
        !item.path.includes('node_modules/') &&
        !item.path.includes('.git/') &&
        !item.path.includes('dist/') &&
        !item.path.includes('build/')
      );
      
      spinner.succeed(`Found ${files.length} source files`);
      return files;
    } catch (error) {
      spinner.fail(`Failed to fetch repository: ${error.message}`);
      throw error;
    }
  }

  async getFileContent(owner, repo, sha) {
    try {
      const response = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/git/blobs/${sha}`,
        {
          headers: {
            Accept: 'application/vnd.github.v3.raw'
          }
        }
      );
      return response.data;
    } catch (error) {
      return null;
    }
  }

  normalizeCode(content) {
    // Limit content size to prevent memory issues
    if (content.length > 10000) {
      content = content.substring(0, 10000);
    }
    
    return content
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/\/\/.*$/gm, '') // Remove line comments
      .replace(/#.*$/gm, '') // Remove Python comments
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[{}();,]/g, '') // Remove punctuation
      .toLowerCase()
      .trim();
  }

  calculateSimilarity(str1, str2) {
    // Skip comparison if strings are too different in length
    const lengthDiff = Math.abs(str1.length - str2.length);
    if (lengthDiff > Math.max(str1.length, str2.length) * 0.8) {
      return 0;
    }
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    // Use a more efficient algorithm for large strings
    if (longer.length > 1000) {
      return this.quickSimilarity(str1, str2);
    }
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  quickSimilarity(str1, str2) {
    // Simple character frequency comparison for large strings
    const freq1 = {};
    const freq2 = {};
    
    for (const char of str1) {
      freq1[char] = (freq1[char] || 0) + 1;
    }
    
    for (const char of str2) {
      freq2[char] = (freq2[char] || 0) + 1;
    }
    
    const allChars = new Set([...Object.keys(freq1), ...Object.keys(freq2)]);
    let similarity = 0;
    let total = 0;
    
    for (const char of allChars) {
      const f1 = freq1[char] || 0;
      const f2 = freq2[char] || 0;
      similarity += Math.min(f1, f2);
      total += Math.max(f1, f2);
    }
    
    return total > 0 ? similarity / total : 0;
  }

  levenshteinDistance(str1, str2) {
    const matrix = Array(str2.length + 1).fill().map(() => Array(str1.length + 1).fill(0));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + cost
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  async compareRepositories(repo1, repo2) {
    console.log(chalk.blue(`\n🔍 Comparing repositories:`));
    console.log(chalk.gray(`  Source: ${repo1}`));
    console.log(chalk.gray(`  Target: ${repo2}\n`));

    const parsed1 = this.parseGitHubUrl(repo1);
    const parsed2 = this.parseGitHubUrl(repo2);

    const [files1, files2] = await Promise.all([
      this.getRepoFiles(parsed1.owner, parsed1.repo),
      this.getRepoFiles(parsed2.owner, parsed2.repo)
    ]);

    // Limit files to prevent memory issues
    const maxFiles = 100;
    const limitedFiles1 = files1.slice(0, maxFiles);
    const limitedFiles2 = files2.slice(0, maxFiles);

    if (files1.length > maxFiles || files2.length > maxFiles) {
      console.log(chalk.yellow(`⚠️  Large repositories detected. Analyzing first ${maxFiles} files from each repo.`));
    }

    const similarities = [];
    const identicalFiles = [];
    const spinner = ora('Analyzing file similarities').start();

    // Process in smaller batches to prevent memory overflow
    const batchSize = 10;
    
    for (let i = 0; i < limitedFiles1.length; i += batchSize) {
      const batch1 = limitedFiles1.slice(i, i + batchSize);
      
      for (const file1 of batch1) {
        const content1 = await this.getFileContent(parsed1.owner, parsed1.repo, file1.sha);
        if (!content1 || content1.length > 50000) continue; // Skip very large files

        const normalized1 = this.normalizeCode(content1);
        
        for (const file2 of limitedFiles2) {
          const content2 = await this.getFileContent(parsed2.owner, parsed2.repo, file2.sha);
          if (!content2 || content2.length > 50000) continue; // Skip very large files

          const normalized2 = this.normalizeCode(content2);
          const similarity = this.calculateSimilarity(normalized1, normalized2);

          if (similarity === 1.0) {
            identicalFiles.push({
              file1: file1.path,
              file2: file2.path
            });
          } else if (similarity > 0.7) {
            similarities.push({
              file1: file1.path,
              file2: file2.path,
              similarity: similarity
            });
          }
        }
      }
      
      // Force garbage collection between batches
      if (global.gc) {
        global.gc();
      }
    }

    spinner.succeed('Analysis complete');
    return { similarities, identicalFiles };
  }

  displayResults(results) {
    const { similarities, identicalFiles } = results;
    
    console.log(chalk.yellow(`\n📊 Similarity Report\n`));
    
    if (identicalFiles.length > 0) {
      console.log(chalk.blue(`Identical files (skipped): ${identicalFiles.length}`));
      identicalFiles.slice(0, 3).forEach(match => {
        console.log(chalk.gray(`  ${match.file1} ↔ ${match.file2}`));
      });
      if (identicalFiles.length > 3) {
        console.log(chalk.gray(`  ... and ${identicalFiles.length - 3} more\n`));
      } else {
        console.log('');
      }
    }
    
    if (similarities.length === 0) {
      console.log(chalk.green('✅ No significant similarities found'));
      return;
    }

    similarities
      .sort((a, b) => b.similarity - a.similarity)
      .forEach(match => {
        const percentage = (match.similarity * 100).toFixed(1);
        const color = match.similarity > 0.9 ? 'red' : match.similarity > 0.8 ? 'yellow' : 'cyan';
        
        console.log(chalk[color](`${percentage}% similarity`));
        console.log(chalk.gray(`  ${match.file1} ↔ ${match.file2}\n`));
      });

    const avgSimilarity = similarities.reduce((sum, s) => sum + s.similarity, 0) / similarities.length;
    const highSimilarity = similarities.filter(s => s.similarity > 0.9).length;
    
    console.log(chalk.blue(`📈 Summary:`));
    console.log(chalk.gray(`  Similar files: ${similarities.length}`));
    console.log(chalk.gray(`  Identical files (skipped): ${identicalFiles.length}`));
    console.log(chalk.gray(`  High similarity (>90%): ${highSimilarity}`));
    console.log(chalk.gray(`  Average similarity: ${(avgSimilarity * 100).toFixed(1)}%`));
    
    if (avgSimilarity > 0.8) {
      console.log(chalk.red('\n⚠️  High plagiarism risk detected!'));
    } else if (avgSimilarity > 0.6) {
      console.log(chalk.yellow('\n⚠️  Moderate similarity detected'));
    } else {
      console.log(chalk.green('\n✅ Low plagiarism risk'));
    }
  }
}

program
  .name('repodm')
  .description('Compare GitHub repositories for plagiarism detection')
  .version('1.0.0');

program
  .command('compare <repo1> <repo2>')
  .description('Compare two GitHub repositories (format: owner/repo or full GitHub URL)')
  .action(async (repo1, repo2) => {
    try {
      const comparer = new RepoComparer();
      const results = await comparer.compareRepositories(repo1, repo2);
      comparer.displayResults(results);
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

program.parse();
