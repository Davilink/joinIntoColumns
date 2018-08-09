'use strict';
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext): void {
	enum Align {
		None
		, Left
		, Right
	};

	type Options = {
		cols: number;
		sep: string;
		align: Align
	};

	enum Reason {
		Cancelled
		, InvalidNumberColumns
	};

	let ReasonExplication = new Map<Reason, string>();
	ReasonExplication.set(Reason.Cancelled, "Cancelled by the user.");
	ReasonExplication.set(Reason.InvalidNumberColumns, "Invalid number of columns. Please enter a valid number.");

	function joinlineIntoColumns(isTrim) {
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

		let _ibo3: vscode.InputBoxOptions = {
			ignoreFocusOut : true
			, prompt : "What do you want to use has padding (by default it's a space) ?"
			, value : " "
		};

		let _qpo1: vscode.QuickPickOptions = {
			ignoreFocusOut : true
		};

		let sip = vscode.window.showInputBox;
		let sqp = vscode.window.showQuickPick;

		let selection = editor.selection;
		let text = editor.document.getText(selection);

		let doTrim = getFnDoTrim(isTrim);
		let doPadding: (str: string, padLength?: number) => string;

		let arrText = [];

		let options: Options = {
			cols : 0
			, sep : ""
			, align: Align.None
		};

		sip(_ibo1)
			.then(FnHelperForCancelled((value) => {
				let number = parseInt(value, 10);

				if(isNaN(number)) {
					return Promise.reject(Reason.InvalidNumberColumns);
				}
				else {
					options.cols = number;

					return sip(_ibo2);
				}
			}))
			.then(FnHelperForCancelled((value) => {
				options.sep = value;
			}))
			.then(() => {
				let items = [Align[Align.None], Align[Align.Left], Align[Align.Right]];

				return sqp(items, _qpo1);
			})
			.then(FnHelperForCancelled((alignValue: string) => {
				options.align = Align[alignValue];
				if (options.align !== Align.None) {
					return sip(_ibo3)
						.then(FnHelperForCancelled((paddingChar: string) => {
							doPadding = getFnDoPadding(alignValue, paddingChar[0] || paddingChar);
					}));
				}
			}))
			.then(() => {
				let paddingLength: number[] = [];
				doTrim(text)
					.split(/\r?\n/g)
					.map(doTrim)
					.filter(value => value.length !== 0)
					.forEach((value, i) => {
						arrText.push(value);
						if (options.align !== Align.None
						&& (paddingLength[i % options.cols] === undefined || paddingLength[i % options.cols] < value.length)) {
							paddingLength[i % options.cols] = value.length;
						}
					});

				editor.edit((builder) => {
					builder.replace(selection
						, arrText.reduce((prev, cur, index) => {
								return prev
									+ (((index+1) % options.cols === 0) ? "\n" : options.sep)
									+ (options.align === Align.None ? cur : doPadding(cur, paddingLength[(index+1) % options.cols]));
							}
							, (options.align === Align.None ? arrText.shift() : doPadding(arrText.shift(), paddingLength[0]))));
				});
			}
			, (reason) => {
				if(reason != Reason.Cancelled)
					vscode.window.showErrorMessage(ReasonExplication.get(reason));
			});
		}

	// This function allow to avoid to check to each Iteration in loop
	// is the trim wanted by using a callback mecanism
	function getFnDoTrim(isTrim: boolean): (str: string) => string {
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
	function getFnDoPadding(align: string, paddingChars: string): (str: string, padLength?: number) => string {
		switch(align) {
			case Align[Align.Right]:
				return (str: string, padLength: number) => {
					padLength++;
					return str.length !== padLength ? Array(padLength - str.length).join(paddingChars) + str : str;
				};
			case Align[Align.Left]:
				return (str: string, padLength: number) => {
					padLength++;
					return str.length !== padLength ? str + Array(padLength - str.length).join(paddingChars) : str;
				};
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