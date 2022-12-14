"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = require("vscode");
const diagnostics_1 = require("./diagnostics");
const cpanel = require("./cpanel/run");
const autocomplete_1 = require("./autocomplete");
const prompter_1 = require("./prompter");
const COMMAND = 'code-actions-sample.command';
function activate(context) {
    //Cookbook
    const provider = new CodePanelViewProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(CodePanelViewProvider.viewType, provider));
    vscode.commands.registerCommand('asp-panel.ASPCookbook', () => {
        context.subscriptions.push(vscode.window.registerWebviewViewProvider(CodePanelViewProvider.viewType, provider));
    });
    //Quick-Fix
    context.subscriptions.push(vscode.languages.registerCodeActionsProvider('asp', new prompter_1.BuiltinAggregateFixer(context), {
        providedCodeActionKinds: prompter_1.BuiltinAggregateFixer.providedCodeActionKinds
    }));
    const emojiDiagnostics = vscode.languages.createDiagnosticCollection("emoji");
    context.subscriptions.push(emojiDiagnostics);
    (0, diagnostics_1.subscribeToDocumentChanges)(context, emojiDiagnostics);
    context.subscriptions.push(vscode.languages.registerCodeActionsProvider('asp', new prompter_1.BuiltinAggregateInfo(), {
        providedCodeActionKinds: prompter_1.BuiltinAggregateInfo.providedCodeActionKinds
    }));
    context.subscriptions.push(vscode.commands.registerCommand(COMMAND, () => vscode.env.openExternal(vscode.Uri.parse('https://www.dlvsystem.it/dlvsite/it/home_it/'))));
    //IntelliSense
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider('asp', (0, autocomplete_1.getASPIntellisenseProvider)(context), '#', '&', ':', '-'));
    context.subscriptions.push(vscode.languages.registerHoverProvider("asp", (0, autocomplete_1.getASPIntellisenseHoverProvider)(context)));
    (0, autocomplete_1.fillDictionaryWithDynamicPredicates)();
}
exports.activate = activate;
// eslint-disable-next-line @typescript-eslint/no-empty-function
function deactivate() { }
module.exports = {
    activate,
    deactivate
};
class CodePanelViewProvider {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    resolveWebviewView(webviewView, context, _token) {
        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,
            enableForms: true,
            enableCommandUris: true,
            localResourceRoots: [
                this._extensionUri
            ]
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        webviewView.webview.onDidReceiveMessage(data => {
            // select text
            const active = vscode.window.activeTextEditor;
            if (!active) {
                return;
            } // null check
            const selection = active.selection;
            if (!selection) {
                return;
            } // null check
            switch (data.type) {
                // DLV
                case 'ADVANCED_KNAPSACK_PROBLEM':
                    active.edit(editBuilder => {
                        const code = new cpanel.Code(this._extensionUri);
                        editBuilder.replace(selection, code.dlv('ADVANCED_KNAPSACK_PROBLEM'));
                    });
                    break;
                case 'KNAPSACK_PROBLEM':
                    active.edit(editBuilder => {
                        const code = new cpanel.Code(this._extensionUri);
                        editBuilder.replace(selection, code.dlv('KNAPSACK_PROBLEM'));
                    });
                    break;
                case '3_COLORABILITY':
                    active.edit(editBuilder => {
                        const code = new cpanel.Code(this._extensionUri);
                        editBuilder.replace(selection, code.dlv('3_COLORABILITY'));
                    });
                    break;
                case 'HAMILTON_PATH':
                    active.edit(editBuilder => {
                        const code = new cpanel.Code(this._extensionUri);
                        editBuilder.replace(selection, code.dlv('HAMILTON_PATH'));
                    });
                    break;
                case 'MINIMUM_SPANNING_TREE':
                    active.edit(editBuilder => {
                        const code = new cpanel.Code(this._extensionUri);
                        editBuilder.replace(selection, code.dlv('MINIMUM_SPANNING_TREE'));
                    });
                    break;
                case 'SEATING':
                    active.edit(editBuilder => {
                        const code = new cpanel.Code(this._extensionUri);
                        editBuilder.replace(selection, code.dlv('SEATING'));
                    });
                    break;
                case 'STRATEGIC_COMPANIES':
                    active.edit(editBuilder => {
                        const code = new cpanel.Code(this._extensionUri);
                        editBuilder.replace(selection, code.dlv('STRATEGIC_COMPANIES'));
                    });
                    break;
                case 'VERTEX_COVER':
                    active.edit(editBuilder => {
                        const code = new cpanel.Code(this._extensionUri);
                        editBuilder.replace(selection, code.dlv('VERTEX_COVER'));
                    });
                    break;
                // showPanel
                case 'showPanel':
                    this.showPanel(webviewView.webview);
                    break;
            }
        });
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            this.showPanel(webviewView.webview);
        });
    }
    _getHtmlForWebview(webview) {
        // Do the same for the stylesheet.
        const styleBootStrapUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'css', 'bootstrap.min.css'));
        // const styleBootStrapIconUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'bootstrap-icon', 'bootstrap-icons.css'));
        const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'css', 'main.css'));
        // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
        const scriptBootStrapUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'js', 'bootstrap.min.js'));
        const scriptMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'js', 'main.js'));
        // Use a nonce to only allow a specific script to be run.
        const nonce = getNonce();
        const cpBody = getCodePanelBody();
        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self' data: ${webview.cspSource}; font-src 'self' data: ${webview.cspSource}; img-src 'self' data: ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleBootStrapUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">

				<title>ASP Cookbook</title>
			</head>
			<body class="text-white" oncopy="return false;">
				${cpBody}
				<script nonce="${nonce}" src="${scriptBootStrapUri}"></script>
				<script nonce="${nonce}" src="${scriptMainUri}"></script>
			</body>
			</html>`;
    }
    showPanel(webview) {
        const active = vscode.window.activeTextEditor;
        if (!active)
            return;
        const type = active.document.fileName.split('.').pop();
        webview.postMessage({ command: type });
    }
}
CodePanelViewProvider.viewType = 'asp-panel.ASPCookbook';
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
function getCodePanelBody() {
    const htmlBody = `
    <div class="container m-2">
        

		<!--
			// ///////////////////////////////
			// DLV Panel
			// ///////////////////////////////
		-->
        <h1>Cookbook</h1>
        <div class="panel panel-primary panel-dlv">
            <div class="panel-heading">
                <h3>With Input</h3>
            </div>
            <div class="panel-body">
                <div class="row">
					<div class="col-12 col-xs-12 col-md-12">
						<a href="#" class="btn btn-secondary btn-sm m-1" role="button" data-act="VERTEX_COVER"><span class="panel-title">Vortex Cover</span></a>
						<a href="#" class="btn btn-secondary btn-sm m-1" role="button" data-act="HAMILTON_PATH"><span class="panel-title">Hamilton Path</span></a>
						<a href="#" class="btn btn-secondary btn-sm m-1" role="button" data-act="STRATEGIC_COMPANIES"><span class="panel-title">Strategic Companies</span></a>
						<a href="#" class="btn btn-secondary btn-sm m-1" role="button" data-act="3_COLORABILITY"><span class="panel-title">3 Colorability</span></a>
						<a href="#" class="btn btn-secondary btn-sm m-1" role="button" data-act="SEATING"><span class="panel-title">Seating</span></a>
						<a href="#" class="btn btn-secondary btn-sm m-1" role="button" data-act="MINIMUM_SPANNING_TREE"><span class="panel-title">Minimum Spanning Tree</span></a>
						<a href="#" class="btn btn-secondary btn-sm m-1" role="button" data-act="KNAPSACK_PROBLEM"><span class="panel-title">Knapsack Problem</span></a>
					</div>
                </div>
            </div>
    </div><div id="check"></div>
	`;
    return htmlBody;
}
//# sourceMappingURL=extension.js.map