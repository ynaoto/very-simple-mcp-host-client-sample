# very-simple-mcp-host-client-sample
(English follows)

とてもシンプルな MCP ホスト/クライアントのサンプルです。
Anthropic Claude API を用いて、対話します。

以下の手順でビルドしてください。（node と npm はご自身でインストールしてください。node を入れると npm も入ります）

`npm install`

`npm run build`

上記が完了し、`build` フォルダができていれば成功です。

このフォルダに `.env` ファイルを作成し、以下の記述が必要です。

```
ANTHROPIC_API_KEY="<ANTHROPICのAPIキー>"
```

`node build/index.js` で実行します。質問を投げてみてください。`quit` を入力すると終了します。
上記 `.env` ファイルが正しくないとエラーになります。

接続する MCP サーバーの設定は `config.json` で行います。
とりあえず `@modelcontextprotocol/server-filesystem` のエントリーを書いてあります。
`<YOUR_HOME>` のところは適宜書き換えてください。


(Japanse above)

This is a very simple MCP host/client sample.
It interacts using the Anthropic Claude API.

Please follow the steps below to build it. (Make sure you have node and npm installed. Installing node will also install npm.)

`npm install`

`npm run build`

If the above completes successfully and a `build` folder is created, you're all set.

Create a `.env` file in this folder with the following content:

```
ANTHROPIC_API_KEY="<Your ANTHROPIC API KEY>"
```

Run it with: `node build/index.js`. Try entering a question. Type `quit` to exit.

If the `.env` file is incorrect, it will result in an error.

You can configure the MCP server connection in `config.json`.  
An entry for `@modelcontextprotocol/server-filesystem` is already included as a placeholder.  
Please replace `<YOUR_HOME>` with the appropriate path for your environment.
