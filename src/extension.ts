'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let editor = vscode.window.activeTextEditor;

	enum Reason {
		Cancelled
		, NumberInvalidForColumns
	};

	let ReasonExplication = new Map<Reason, string>();
	ReasonExplication.set(Reason.Cancelled, "Cancelled by the user.");
	ReasonExplication.set(Reason.NumberInvalidForColumns, "Invalid number has been enter for the columns.");

	function joinlineIntoColumns(editor, isTrim) {
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

		let Sib = vscode.window.showInputBox;

		let selection = editor.selection;
		let text = editor.document.getText(selection);

		let options = {
			'cols' : 0
			, 'sep' : ""
		};

		Sib(_ibo1).then((value) => {
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

					return Promise.resolve(Sib(_ibo2));
				}
			}
		})
		.then((value) => {
			if(value === undefined) {
				return Promise.reject(Reason.Cancelled);
			}
			else {
				options.sep = value;
				return Promise.resolve();
			}
		})
		.then(() => {
			let getText = getFnGetText(isTrim);

			let arrText = getText(text).split(/\r?\n/g);

			editor.edit((builder) => {						
				builder.replace(selection
					, arrText.reduce((prev, cur, index) => {
							return prev
								+ (((index+1) % options.cols == 0) ? "\n" : options.sep)
								+ getText(cur);
						}
						, getText(arrText.shift())));
			});
		}
		, (reason) => {
			if(reason != Reason.Cancelled)
				vscode.window.showErrorMessage(ReasonExplication.get(reason));
		});
	}

	function getFnGetText(isTrim) {
		if(isTrim)
			return (str) => {
				return str;
			}
		else
			return (str) => {
				return str.trim();
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
		joinlineIntoColumns(editor, false);
	});

	let command2 = vscode.commands.registerCommand('joinLineIntoCol.withTrim', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		joinlineIntoColumns(editor, true);
	});

		context.subscriptions.push(command1);
		context.subscriptions.push(command2);
}

// this method is called when your extension is deactivated
export function deactivate() {
}