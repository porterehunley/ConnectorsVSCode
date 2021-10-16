import { QuickPickItem, window, Disposable, CancellationToken, QuickInputButton, QuickInput, ExtensionContext, QuickInputButtons, Uri } from 'vscode';
import {PythonShell, Options} from 'python-shell';
import { v4 as uuidv4 } from 'uuid';
import * as axios from 'axios';
import * as fs from 'fs';
import * as cp from 'child_process';
import * as vscode from 'vscode';
import * as util from 'util';
import { resolve } from 'path';


export async function loginIfNeeded() {
    let loginOptions: Options = {
        mode: "text",
        pythonPath: __dirname + '/../src/tools/paconn-cli/venv/bin/python3',
        pythonOptions: ['-u'],
        scriptPath: __dirname + '/../src/tools/paconn-cli/venv/lib/python3.8/site-packages',
        args: ['login']
    };

    let loginPyshell = new PythonShell('paconn', loginOptions);
    loginPyshell.on('message', function (message) {
    	vscode.window.showInformationMessage(message);
    });
}

export async function openSourceConnectorImport(context: ExtensionContext) {
	const connectorTypes: QuickPickItem[] = ['certified-connectors', 'custom-connectors', 'independent-publisher-connectors']
		.map(label => ({ label }));

	interface State {
		title: string;
		step: number;
		totalSteps: number;
		connectorType: string;
		name: string;
        swaggerUri: string;
        apiPropsUri: string;
        resourceGroup: QuickPickItem | string;
        loadedConnectors: string[];
		runtime: QuickPickItem;
        connector: QuickPickItem;
        connectionParams: any;
	}

	async function collectInputs() {
		const state = {} as Partial<State>;
		await MultiStepInput.run(input => pickConnectorType(input, state));
		return state as State;
	}

	const title = 'Import Connector';

	async function pickConnectorType(input: MultiStepInput, state: Partial<State>) {
		const pick = await input.showQuickPick({
			title,
			step: 1,
			totalSteps: 3,
			placeholder: 'Pick a connector type',
			items: connectorTypes,
			activeItem: typeof state.connectorType !== 'string' ? state.connectorType: undefined,
			shouldResume: shouldResume
		});
		state.connectorType = pick.label;

		return (input: MultiStepInput) => pickConnector(input, state);
	}

	async function pickConnector(input: MultiStepInput, state: Partial<State>) {
		const connectors = await getConnectors(state.connectorType || 'custom-connectors');
		state.connector = await input.showQuickPick({
			title,
			step: 2,
			totalSteps: 4,
			placeholder: 'Pick a runtime',
			items: connectors,
			activeItem: state.runtime,
			shouldResume: shouldResume
		});

        return (input: MultiStepInput) => createConnectionParamsBase(input, state);
	}

    async function createConnectionParamsBase(input: MultiStepInput, state: Partial<State>) {
        let apiProps= await getApiProps(state.connector?.label || 'NSF Data', state.connectorType || 'custom-connectors');
        await getSwagger(state.connector?.label || 'NSF Data', state.connectorType || 'custom-connectors');
        state.connectionParams = apiProps.properties.connectionParams || {};
        let connectionParams = <{name: string}[]>Object.keys(apiProps.properties.connectionParameters || {}).map(key => ({...apiProps.properties.connectionParameters[key], name: key}));
        return createConnectionParamsInput(input, state, connectionParams);
    }

    async function createConnectionParamsInput(input: MultiStepInput, state: Partial<State>, connectionParameters: {name: string}[]): Promise<any> {
        if (connectionParameters.length === 0) {
            return (input: MultiStepInput) => inputName(input, state);
        }
        let param = connectionParameters[0];
        state.connectionParams[param.name] = await input.showInputBox({
            title,
            step: 3,
            totalSteps: 4,
            value: typeof state.connectionParams[param.name] === 'string' ? state.connectionParams[param.name] : '',
            prompt: 'Input ' + param.name,
            validate: validateNameIsUnique,
            shouldResume: shouldResume
        });

        return (input: MultiStepInput) => createConnectionParamsInput(input, state, connectionParameters.slice(1));
    }

	async function inputName(input: MultiStepInput, state: Partial<State>) {
		state.name = await input.showInputBox({
			title,
			step: 3,
			totalSteps: 4,
			value: state.name || '',
			prompt: 'Choose a unique name for the Connector',
			validate: validateNameIsUnique,
			shouldResume: shouldResume
		});
	}

	function shouldResume() {
		// Could show a notification with the option to resume.
		return new Promise<boolean>((resolve, reject) => {
			// noop
		});
	}

	async function validateNameIsUnique(name: string) {
		// ...validate...
		await new Promise(resolve => setTimeout(resolve, 1000));
		return name === 'vscode' ? 'Name not unique' : undefined;
	}

	async function getConnectors(connectorType: string): Promise<QuickPickItem[]> {
        let connectorsListUrl = `https://api.github.com/repos/microsoft/powerplatformconnectors/contents/${connectorType}?ref=master`;
        let response = await axios.default.get(connectorsListUrl);
        return response.data.map((x: { name: string; }) => x.name).map((label: string) => ({label}));
	}

    async function getApiProps(connectorName: string, connectorType: string): Promise<any> {
        let apiPropsUrl = `https://raw.githubusercontent.com/microsoft/powerplatformconnectors/master/${connectorType}/${connectorName}/apiProperties.json`;
        let response = await axios.default.get(apiPropsUrl);

        let result = fs.writeFileSync(__dirname + '/../src/swagger/'+connectorName.replace(' ','_')+'.apiProperties.json', JSON.stringify(response.data));
        return response.data;
    }

    async function getSwagger(connectorName: string, connectorType: string): Promise<any> {
        let swaggerUrl = `https://raw.githubusercontent.com/microsoft/powerplatformconnectors/master/${connectorType}/${connectorName}/apiDefinition.swagger.json`;
        let response = await axios.default.get(swaggerUrl);

        let result = fs.writeFileSync(__dirname +'/../src/swagger/'+connectorName.replace(' ','_')+'.apiDefinition.swagger.json', JSON.stringify(response.data));
        return response.data;
    }

	const state = await collectInputs();
	window.showInformationMessage(`Creating Connector '${state.connector}'`);

    let swaggerUri = __dirname +'/../src/swagger/'+state.connector.label.replace(' ','_')+'.apiDefinition.swagger.json';
    let apiPropsUri = __dirname + '/../src/swagger/'+state.connector.label.replace(' ','_')+'.apiProperties.json';
    let environment = 'b18407c8-99ae-49f4-8e65-f9a8543c10e3';
    try {
        await createConnectorAndConnection(swaggerUri, state.connectionParams, apiPropsUri, environment);
        await generateCode(swaggerUri, state.connector.label.replace(' ','_'));
    } catch (error) {
        vscode.window.showErrorMessage(<string>error);
    }
}


export async function generateCode(swaggerUri: string, name: string) {
    let exec = util.promisify(cp.exec);
    let rootDir = '';
    if (vscode.workspace.workspaceFolders) {
        rootDir = vscode.workspace.workspaceFolders[0].uri.path + '/src/' + name;
    }

    const scriptOptios = {
        cwd: __dirname+'/..'
    };
    const {stderr} = await exec(`npx openapi-generator-cli generate -g typescript-axios -i ${swaggerUri} -o ${rootDir}`, scriptOptios);
    if (stderr) {
        console.log('GENERATION ERROR: ' + stderr);
    }

    // Copy the authentication code
    vscode.workspace.fs.copy(Uri.parse(__dirname + '/../src/auth.ts'), Uri.parse(rootDir + '/auth.ts'));
}

export async function createConnectorAndConnection(swaggerUri: string, connectionParameters: any, apiPropsUri: string,environment: string) {
    let sampleSwagger = JSON.parse(fs.readFileSync(swaggerUri, 'utf-8'));
    let connectorName = sampleSwagger.info.title.replace(' ','_');
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

    return new Promise((resolve, reject) => {

        let createOptions = {...loginOptions, args: ['create', '-e', environment, '--api-prop', apiPropsUri, '--api-def', swaggerUri]};
        let createPyshell = new PythonShell('paconn', createOptions);
        createPyshell.on('message', function (message: string) {
            console.log('Connector created!');
        });

        createPyshell.on('stderr', function (stderr: string) {
            if (stderr.includes('Access token invalid')){ return reject(stderr); }

            let apiRegistration = JSON.parse(stderr);
            let runtimeUrl = apiRegistration.properties.primaryRuntimeUrl;
            let connectorId = apiRegistration.name;
            let connectionId = uuidv4();
            let connectionOptions = {...loginOptions, args: [
                'connection', 
                '-e', environment,
                '--con-params', JSON.stringify(connectionParameters),
                '--cid', connectorId,
                '--coid', connectionId
            ]};

            let connectionPyshell = new PythonShell('paconn', connectionOptions);
            connectionPyshell.on('message', function (message: string) {
                console.log(message);
                return reject(message);
            });

            connectionPyshell.on('stderr', function (stderr: string) {
                let connectionProps = JSON.parse(stderr);
                let connectionName = connectionProps.name;
                let apimUrl = runtimeUrl + '/' + connectionName;

                // Alter the swagger
                sampleSwagger.host = apimUrl.replace("https://", "").split("/")[0];
                sampleSwagger.basePath = "/" + apimUrl.replace("https://","").split("/").slice(1).join("/");

                let authParameter = {
                    name: "authorization",
                    in: "header",
                    type: "string",
                    required: true
                };
                sampleSwagger.parameters['authParameter'] = authParameter;

                // We also need a subscription key paramter I think

                // Add the bearer auth to every path
                Object.entries(sampleSwagger.paths).forEach(([key, value]) => {
                    Object.entries(<any>value).forEach(([method, methodVal]) => {
                        ((<any>methodVal).parameters || []).push({"$ref": "#/parameters/authParameter"});
                    });
                });
                let swaggerPrefix = 

                fs.writeFileSync(`/Users/porterhunley/connectors/src/swagger/${connectorName}.apiDefinition.swagger.json`, JSON.stringify(sampleSwagger));
                return resolve("Connector created!");
            });
        });
    });

}


// -------------------------------------------------------
// Helper code that wraps the API for the multi-step case.
// -------------------------------------------------------


class InputFlowAction {
	static back = new InputFlowAction();
	static cancel = new InputFlowAction();
	static resume = new InputFlowAction();
}

type InputStep = (input: MultiStepInput) => Thenable<InputStep | void>;

interface QuickPickParameters<T extends QuickPickItem> {
	title: string;
	step: number;
	totalSteps: number;
	items: T[];
	activeItem?: T;
	placeholder: string;
	buttons?: QuickInputButton[];
	shouldResume: () => Thenable<boolean>;
}

interface InputBoxParameters {
	title: string;
	step: number;
	totalSteps: number;
	value: string;
	prompt: string;
	validate: (value: string) => Promise<string | undefined>;
	buttons?: QuickInputButton[];
	shouldResume: () => Thenable<boolean>;
}

class MultiStepInput {

	static async run<T>(start: InputStep) {
		const input = new MultiStepInput();
		return input.stepThrough(start);
	}

	private current?: QuickInput;
	private steps: InputStep[] = [];

	private async stepThrough<T>(start: InputStep) {
		let step: InputStep | void = start;
		while (step) {
			this.steps.push(step);
			if (this.current) {
				this.current.enabled = false;
				this.current.busy = true;
			}
			try {
				step = await step(this);
			} catch (err) {
				if (err === InputFlowAction.back) {
					this.steps.pop();
					step = this.steps.pop();
				} else if (err === InputFlowAction.resume) {
					step = this.steps.pop();
				} else if (err === InputFlowAction.cancel) {
					step = undefined;
				} else {
					throw err;
				}
			}
		}
		if (this.current) {
			this.current.dispose();
		}
	}

	async showQuickPick<T extends QuickPickItem, P extends QuickPickParameters<T>>({ title, step, totalSteps, items, activeItem, placeholder, buttons, shouldResume }: P) {
		const disposables: Disposable[] = [];
		try {
			return await new Promise<T | (P extends { buttons: (infer I)[] } ? I : never)>((resolve, reject) => {
				const input = window.createQuickPick<T>();
				input.title = title;
				input.step = step;
				input.totalSteps = totalSteps;
				input.placeholder = placeholder;
				input.items = items;
				if (activeItem) {
					input.activeItems = [activeItem];
				}
				input.buttons = [
					...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
					...(buttons || [])
				];
				disposables.push(
					input.onDidTriggerButton(item => {
						if (item === QuickInputButtons.Back) {
							reject(InputFlowAction.back);
						} else {
							resolve(<any>item);
						}
					}),
					input.onDidChangeSelection(items => resolve(items[0])),
					input.onDidHide(() => {
						(async () => {
							reject(shouldResume && await shouldResume() ? InputFlowAction.resume : InputFlowAction.cancel);
						})()
							.catch(reject);
					})
				);
				if (this.current) {
					this.current.dispose();
				}
				this.current = input;
				this.current.show();
			});
		} finally {
			disposables.forEach(d => d.dispose());
		}
	}

	async showInputBox<P extends InputBoxParameters>({ title, step, totalSteps, value, prompt, validate, buttons, shouldResume }: P) {
		const disposables: Disposable[] = [];
		try {
			return await new Promise<string | (P extends { buttons: (infer I)[] } ? I : never)>((resolve, reject) => {
				const input = window.createInputBox();
				input.title = title;
				input.step = step;
				input.totalSteps = totalSteps;
				input.value = value || '';
				input.prompt = prompt;
				input.buttons = [
					...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
					...(buttons || [])
				];
				let validating = validate('');
				disposables.push(
					input.onDidTriggerButton(item => {
						if (item === QuickInputButtons.Back) {
							reject(InputFlowAction.back);
						} else {
							resolve(<any>item);
						}
					}),
					input.onDidAccept(async () => {
						const value = input.value;
						input.enabled = false;
						input.busy = true;
						if (!(await validate(value))) {
							resolve(value);
						}
						input.enabled = true;
						input.busy = false;
					}),
					input.onDidChangeValue(async text => {
						const current = validate(text);
						validating = current;
						const validationMessage = await current;
						if (current === validating) {
							input.validationMessage = validationMessage;
						}
					}),
					input.onDidHide(() => {
						(async () => {
							reject(shouldResume && await shouldResume() ? InputFlowAction.resume : InputFlowAction.cancel);
						})()
							.catch(reject);
					})
				);
				if (this.current) {
					this.current.dispose();
				}
				this.current = input;
				this.current.show();
			});
		} finally {
			disposables.forEach(d => d.dispose());
		}
	}
}