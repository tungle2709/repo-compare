class Repodiffmatch < Formula
  desc "CLI tool to compare GitHub repositories for plagiarism detection"
  homepage "https://github.com/tungle2709/RepoDiffMatch"
  url "https://github.com/tungle2709/RepoDiffMatch/archive/v1.0.0.tar.gz"
  sha256 "PLACEHOLDER_SHA256"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *Language::Node.std_npm_install_args(libexec)
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    system "#{bin}/repodm", "--version"
  end
end
