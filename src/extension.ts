'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let editor = vscode.window.activeTextEditor;

	enum Align {
		None
		, Left
		, Right
	};

	enum Reason {
		Cancelled
		, NumberInvalidForColumns
	};

	let ReasonExplication = new Map<Reason, string>();
	ReasonExplication.set(Reason.Cancelled, "Cancelled by the user.");
	ReasonExplication.set(Reason.NumberInvalidForColumns, "Invalid number has been enter for the columns.");

	function joinlineIntoColumns(editor, isTrim, isAlign) {
		if(!editor) {
				return;
		}

		let _ibo1: vscode.InputBoxOptions = {
			ignoreFocusOut : true
			, prompt : "How many columns ?"
			, placeHolder : "5"
			, value : "5"
		};

		let _ibo2: vscode.InputBoxOptions = {
			ignoreFocusOut : true
			, prompt : "What do you to user has joiner"
		};

		let _qpo1: vscode.QuickPickOptions = {
			ignoreFocusOut : true
		};

		let sip = vscode.window.showInputBox;
		let sqp = vscode.window.showQuickPick;

		let selection = editor.selection;
		let text = editor.document.getText(selection);

		let doTrim = getFnDoTrim(isTrim);
		let doPadding;

		let maxLength = -1;
		let arrText = [];

		for(let cur of doTrim(text)
										.split(/\r?\n/g))
		{
			//Trim the text if wanted
			let txt = doTrim(cur);

			//Filter out the empty element
			if(txt.length == 0) {
				continue;
			}
			
			//get the largest length
			if(txt.length > maxLength) {
				maxLength = txt.length;
			}

			arrText.push(txt);
		}

		let options = {
			'cols' : 0
			, 'sep' : ""
		};

		let _promise = sip(_ibo1)
			.then((value) => {
				if(value === undefined) {
					return Promise.reject(Reason.Cancelled);
				}
				else {
					let number = parseInt(value);

					if(isNaN(number)) {
						return Promise.reject(Reason.NumberInvalidForColumns);
					}
					else {
						options.cols = number;

						return Promise.resolve(sip(_ibo2));
					}
				}
			})
			.then((value) => {
				if(value === undefined) {
					return Promise.reject(Reason.Cancelled);
				}
				else {
					options.sep = value;
					return Promise.resolve(value);
				}
			});

			//Add the Align in the pipeline and get the doTrim function
			if(isAlign) {
				_promise = _promise
					.then((value) => {
						if(value === undefined) {
							return Promise.reject(Reason.Cancelled);
						}
						else {
							let items = [Align[Align.Left], Align[Align.Right]];
							return Promise.resolve(sqp(items, _qpo1));
						}
					})
					.then((value) => {
						if(value === undefined) {
							return Promise.reject(Reason.Cancelled);
						}
						else {
							doPadding = getFnDoPadding(Align[value], maxLength);
							}

							return Promise.resolve();
						});
			}
			else {
				doPadding = getFnDoPadding(Align.None, maxLength);
			}

			_promise.then(() => {
				editor.edit((builder) => {			
					builder.replace(selection
						, arrText.reduce((prev, cur, index) => {
								return prev
									+ (((index+1) % options.cols == 0) ? "\n" : options.sep)
									+ doPadding(cur);
							}
							, doPadding(arrText.shift())));
				});
			}
			, (reason) => {
				if(reason != Reason.Cancelled)
					vscode.window.showErrorMessage(ReasonExplication.get(reason));
			});
		}
	
	// This function allow to avoid to check to each Iteration in loop
	// is the trim wanted by using a callback mecanism
	function getFnDoTrim(isTrim) {
		if(isTrim)
			return (str) => {
				return str.trim();
			}
		else
			return (str) => {
				return str;
			}
	}

	// This function allow to avoid to check to each Iteration in loop
	// what Align mode is wanted by using a callback mecanism
	function getFnDoPadding(align: Align, padLength: number) {
		if(align == Align.None) {
			return (str) => {
					return str;
				}
		}
		
		let padding = Array(padLength).join(" ");
		switch(align) {
			case Align.Left:
				return (str) => {
					return (padding+str).slice(-padding.length);
				}
			case Align.Right:
				return (str) => {
					return (str+padding).substring(0, padding.length);
				}
		}
	}
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	// console.log('Congratulations, your extension "line-tabler" is now active!');
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let command1 = vscode.commands.registerCommand('joinLineIntoCol.noTrim', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		joinlineIntoColumns(editor, false, false);
	});

	let command2 = vscode.commands.registerCommand('joinLineIntoCol.withTrim', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		joinlineIntoColumns(editor, true, false);
	});

	let command3 = vscode.commands.registerCommand('joinLineIntoCol.noTrimWithAlign', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		joinlineIntoColumns(editor, false, true);
	});

	let command4 = vscode.commands.registerCommand('joinLineIntoCol.withTrimWithAlign', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		joinlineIntoColumns(editor, true, true);
	});

		context.subscriptions.push(command1);
		context.subscriptions.push(command2);
		context.subscriptions.push(command3);
		context.subscriptions.push(command4);
}

// this method is called when your extension is deactivated
export function deactivate() {
}