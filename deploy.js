// GitHub Pagesへ直接デプロイ（node_modules配下のフォントも含める）
const { execSync } = require('child_process');
const fs = require('fs');

const run = (cmd) => execSync(cmd, { stdio: 'inherit' });

// .nojekyllを追加（_expoフォルダを有効化）
fs.writeFileSync('dist/.nojekyll', '');

// distをgh-pagesブランチに直接pushする
run('cd dist && git init -b gh-pages');
run('cd dist && git add -A');
run('cd dist && git commit -m "Deploy to GitHub Pages"');
run('cd dist && git push -f https://github.com/masauehr/iphone-weather-app.git gh-pages');

// 一時gitを削除
fs.rmSync('dist/.git', { recursive: true, force: true });

console.log('✅ デプロイ完了: https://masauehr.github.io/iphone-weather-app/');
