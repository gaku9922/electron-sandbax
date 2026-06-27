// Pingボタンの処理
document.getElementById('pingBtn').addEventListener('click', async () => {
    // バックエンドからの返事を待つ (await)
    const response = await window.myAPI.ping();
    // 画面に結果を表示
    document.getElementById('pingResult').innerText = response;
  });
  
  // システム情報ボタンの処理
  document.getElementById('sysBtn').addEventListener('click', async () => {
    // バックエンドからPCの情報(オブジェクト)を受け取る
    const info = await window.myAPI.getSystemInfo();
    // 受け取ったデータを文字列にして画面に表示
    document.getElementById('sysResult').innerText = 
      `OS: ${info.platform}, アーキテクチャ: ${info.arch}, CPUコア数: ${info.cpuCores}`;
  });