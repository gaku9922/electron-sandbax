
// Pingボタンの処理
document.getElementById('pingBtn').addEventListener('click', async () => {
    const response = await window.myAPI.ping();
    document.getElementById('pingResult').innerText = response;
});


// システム情報ボタンの処理
document.getElementById('sysBtn').addEventListener('click', async () => {
  const info = await window.myAPI.getSystemInfo();
  document.getElementById('sysResult').innerText = 
    `OS: ${info.platform}, アーキテクチャ: ${info.arch}, CPUコア数: ${info.cpuCores}`;
});