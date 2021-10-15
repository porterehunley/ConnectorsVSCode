// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { window, commands, ExtensionContext } from 'vscode';
import {PythonShell, Options} from 'python-shell';
import { v4 as uuidv4 } from 'uuid';
import * as nsfSwagger from '../src/swagger/apiDefinition.swagger.json';
import * as fs from 'fs'; 
import * as cp from 'child_process';
import { multiStepInput } from './input';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "connectors" is not active!');

	let inputs = vscode.commands.registerCommand('connectors.input', async () => {
		const options: { [key: string]: (context: ExtensionContext) => Promise<void> } = {
			multiStepInput,
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

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('connectors.addConnector', async () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		try {
			console.log(vscode.workspace.workspaceFolders);
			let rootDir = '';
			if (vscode.workspace.workspaceFolders) {
				rootDir = vscode.workspace.workspaceFolders[0].uri.path;
			}

			//TODO need to find the top level index.ts
			let encoder = new TextEncoder();
			vscode.workspace.fs.createDirectory(vscode.Uri.parse(rootDir + '/src'));
			vscode.workspace.fs.writeFile(vscode.Uri.parse(rootDir + '/src/helloWorld.txt'), encoder.encode('Hello'));
		} catch (error) {
			console.log(error);
		}
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(inputs);
}

// this method is called when your extension is deactivated
export function deactivate() {}
