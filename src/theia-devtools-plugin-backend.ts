import * as path from 'path';
import * as theia from '@theia/plugin';

export function start(context: theia.PluginContext) {
    const informationMessageTestCommand = {
        id: 'hello-world-example-generated',
        label: "Hello World"
    };
    context.subscriptions.push(theia.commands.registerCommand(informationMessageTestCommand, (...args: any[]) => {
        theia.window.showInformationMessage('Hello World!');
    }));
    const webViewStartCommand = {
        id: 'webView.start',
        label: "Start UI5"
    };
    context.subscriptions.push(
        theia.commands.registerCommand(webViewStartCommand, () => {
            UI5Panel.createOrShow(context.extensionPath);
        })
    );

}

export function stop() {

}

class UI5Panel {
	/**
	 * Track the currently panel. Only allow a single panel to exist at a time.
	 */
    public static currentPanel: UI5Panel | undefined;

    private static readonly viewType = 'ui5';

    private readonly _panel: theia.WebviewPanel;
    private readonly _extensionPath: string;
    private _disposables: theia.Disposable[] = [];

    public static createOrShow(extensionPath: string) {
        const column = theia.window.activeTextEditor ? theia.window.activeTextEditor.viewColumn : undefined;

        // If we already have a panel, show it.
        // Otherwise, create a new panel.
        if (UI5Panel.currentPanel) {
            UI5Panel.currentPanel._panel.reveal(column);
        } else {
            UI5Panel.currentPanel = new UI5Panel(extensionPath, column || theia.ViewColumn.One);
        }
    }

    private constructor(extensionPath: string, column: theia.ViewColumn) {
        this._extensionPath = extensionPath;

        // Create and show a new webview panel
        this._panel = theia.window.createWebviewPanel(UI5Panel.viewType, "ui5", column, {
            // Enable javascript in the webview
            enableScripts: true,

            // And restric the webview to only loading content from our extension's `webApp` directory.
            localResourceRoots: [theia.Uri.file(path.join(extensionPath, 'webApp'))]

        });

        // Set the webview's initial html content
        this._panel.webview.html = this._getHtmlForWebview();

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'alert':
                    theia.window.showErrorMessage(message.text);
                    return;
            }
        }, null, this._disposables);
    }

    public doRefactor() {
        // Send a message to the webview webview.
        // You can send any JSON serializable data.
        this._panel.webview.postMessage({ command: 'refactor' });
    }

    public dispose() {
        UI5Panel.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _getHtmlForWebview() {
        const html = `<!DOCTYPE html>
		<html lang="en">
		<head>
		<meta charset="UTF-8">
			<title>Beginner Tutorial Galilei - HTML5/JS - Level 2</title>
			<base href="${theia.Uri.file(path.join(this._extensionPath, 'webApp')).with({ scheme: 'theia-resource' })}/">
			<script>window.parent = {};</script>
			<script id="sap-ui-bootstrap"
				src="https://openui5.hana.ondemand.com/resources/sap-ui-core.js"
				data-sap-ui-theme="sap_belize"
				data-sap-ui-libs="sap.m"
				data-sap-ui-resourceroots='{"Quick": "./"}'
				data-sap-ui-onInit="module:Quick/index"
				data-sap-ui-compatVersion="edge"
				data-sap-ui-async="true">
			</script>
		</head>
		<body class="sapUiBody" id="content">
		</body>
		</html>`;

        return html;
    }
}
