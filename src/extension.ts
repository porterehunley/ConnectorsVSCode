// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {PythonShell, Options} from 'python-shell';
import * as nsfData from '../src/nsfdata';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "connectors" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('connectors.addConnector', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		
		// Make sure we can login to the cli

		try {
			let loginOptions: Options = {
				mode: "text",
				pythonPath: __dirname + '/../src/tools/paconn-cli/venv/bin/python3',
				pythonOptions: ['-u'],
				scriptPath: __dirname + '/../src/tools/paconn-cli/venv/lib/python3.8/site-packages',
				args: ['login']
			};

			// let loginPyshell = new PythonShell('paconn', loginOptions);
			// loginPyshell.on('message', function (message) {
			// 	vscode.window.showInformationMessage(message);
			// });

			let createOptions = {...loginOptions, args: ['create', '-e', 'b18407c8-99ae-49f4-8e65-f9a8543c10e3', '--api-prop', '/Users/porterhunley/connectors/swagger/apiProperties.json', '--api-def', '/Users/porterhunley/connectors/swagger/apiDefinition.swagger.json']};
			let createPyshell = new PythonShell('paconn', createOptions);
			let apiRegistration: string;
			createPyshell.on('message', function (message) {
				console.log(message);
				apiRegistration = message;
			});

			createPyshell.on('stderr', function (stderr) {
				console.log(stderr);
			});

			createPyshell.on('error', function (stderr) {
				console.log(stderr);
			});

			// vscode.env.openExternal(vscode.Uri.parse("https://www.stackoverflow.com/"));
		} catch (error) {
			console.log(error);
		}
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
