'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	enum Align {
		None
		, Left
		, Right
	};

	enum Reason {
		Cancelled
		, InvalidNumberColumns
	};

	let ReasonExplication = new Map<Reason, string>();
	ReasonExplication.set(Reason.Cancelled, "Cancelled by the user.");
	ReasonExplication.set(Reason.InvalidNumberColumns, "Invalid number of columns. Please enter a valid number.");

	async function joinlineIntoColumns(isTrim) {
		let editor = vscode.window.activeTextEditor;

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
			, prompt : "What do you want to use has joiner ?"
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

		sip(_ibo1)
			.then(FnHelperForCancelled((value) => {
				let number = parseInt(value);

				if(isNaN(number)) {
					return Promise.reject(Reason.InvalidNumberColumns);
				}
				else {
					options.cols = number;

					return Promise.resolve(sip(_ibo2));
				}
			}))
			.then(FnHelperForCancelled((value) => {
				options.sep = value;
				return Promise.resolve(value);
			}))
			.then(FnHelperForCancelled((value) => {
				let items = [Align[Align.None], Align[Align.Left], Align[Align.Right]];
				return Promise.resolve(sqp(items, _qpo1));
			}))
			.then(FnHelperForCancelled((value: string) => {
				doPadding = getFnDoPadding(value, maxLength);
				return Promise.resolve();
			}))
			.then(() => {
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
	function getFnDoPadding(align: string, padLength: number) {
		if(align == Align[Align.None]) {
			return (str) => {
					return str;
				}
		}

		//Adjust the padding, otherwise the largest string would lose a caracter
		padLength++;
		
		let padding = Array(padLength).join(" ");
		switch(align) {
			case Align[Align.Right]:
				return (str) => {
					return str.length != padLength ? (padding+str).slice(-padding.length) : str;
				}
			case Align[Align.Left]:
				return (str) => {
					return str.length != padLength ? (str+padding).substring(0, padding.length) : str;
				}
		}
	}

	// Instead of checking for the Cancelled Action manually in
	// each then() call, we use that wrapping helper
	function FnHelperForCancelled(fn) {
		return (value) => {
			if(value === undefined) {
				return Promise.reject(Reason.Cancelled);
			}
			else {
				return fn(value);
			}
		}
	}

	let command1 = vscode.commands.registerCommand('joinLinesIntoCols.noTrim', () => {
		joinlineIntoColumns(false);
	});

	let command2 = vscode.commands.registerCommand('joinLinesIntoCols.withTrim', () => {
		joinlineIntoColumns(true);
	});

	context.subscriptions.push(command1);
	context.subscriptions.push(command2);
}

export function deactivate() {
}