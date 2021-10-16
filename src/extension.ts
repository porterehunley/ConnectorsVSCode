import * as vscode from 'vscode';
import { window, commands, ExtensionContext } from 'vscode';
import { openSourceConnectorImport } from './input';
import { getAuthToken } from './auth';


export function activate(context: vscode.ExtensionContext) {
	let inputs = vscode.commands.registerCommand('connectors.importConnector', async () => {
		const options: { [key: string]: (context: ExtensionContext) => Promise<void> } = {
			openSourceConnectorImport,
		};
		const quickPick = window.createQuickPick();
		quickPick.items = Object.keys(options).map(label => ({ label }));
		quickPick.onDidChangeSelection(selection => {
			if (selection[0]) {
				options[selection[0].label](context)
					.catch(console.error);
			}
		});

		quickPick.onDidHide(() => quickPick.dispose());
		quickPick.show();
	});

	let disposable = vscode.commands.registerCommand('connectors.test', async () => {
		try {
			let data = await getAuthToken();
			console.log(data);
		} catch (error) {
		}
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(inputs);
}

export function deactivate() {}
