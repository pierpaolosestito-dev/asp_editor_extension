/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

/** To demonstrate code actions associated with Diagnostics problems, this file provides a mock diagnostics entries. */

import * as vscode from 'vscode';

/** String to detect in the text document. */
const END_CHARACTER_OF_A_RULE = '.';
export const CODE_ERROR = 'Errore 104';

const aggregatesRegex = new RegExp(/^#(?:count|sum|times|min|max){\s*(?:\w+|_)\s*(,\s*(?:\w+|_))*\s*:\s*\w+\(\s*(?:\w+|_)(\s*(?:,\s*(?:\w+|_)*\s*|\s*\))*\s*)\s*(?:,\s*\w+\(\s*(?:\w+|_)(\s*,\s*(?:\w+|_)*\s*)*\)\s*)*\s*}$/g);
const builtInRegex = new RegExp(/^&\w+\s*\(\s*\w+\s*(\s*,\s*\w+\s*)*(\s*;\s*\w+\s*)\)$/g);

/**
 * Analyzes the text document for problems. 
 * This demo diagnostic problem provider finds all mentions of 'emoji'.
 * @param doc text document to analyze
 * @param emojiDiagnostics diagnostic collection
 */
export function refreshDiagnostics(doc: vscode.TextDocument, emojiDiagnostics: vscode.DiagnosticCollection): void {
	console.log("----------refresh----------");
	const diagnostics: vscode.Diagnostic[] = [];
	
	for (let lineIndex = 0; lineIndex < doc.lineCount; lineIndex++) {
		const lineOfText = doc.lineAt(lineIndex);
		if (lineOfText.text.endsWith(END_CHARACTER_OF_A_RULE)|| (lineIndex != (doc.lineCount)-1 && doc.lineAt(lineIndex+1).text.length == 0 && !lineOfText.text.endsWith(".") ) ) { 
		//TODO controllare qui che qualcosa non va -> due righe giuste consecutive, la seconda è considerata sbagliata
			//Effettuiamo i vari check della sintassi
			//Controlla se è presente il :-
			let constructs:string[] = [];
			if(!lineOfText.text.includes(":-")){
				constructs = parseTail(lineOfText.text);
				console.log("constructsT = " + constructs);
			} else {
				//Fa il parsing della regola in costrutti
				constructs = parseRule(lineOfText.text);
			}
			
			//Se la riga è vuota non fare nulla
			if(constructs==null){
				console.log("linea nulla -> skip");
				continue;
			}
			//Scorri tutti i costrutti per vedere se c'è qualcosa da sottolineare come errato
			for(let i=0;i<constructs.length;i++){
				if(constructs[i]==""){
					continue;
				}
				//console.log("checking " + constructs[i] + " i=" + i);
				//Controllo aggregati
				
				//if(constructs[i].includes("#") && !aggregatesRegex.test(constructs[i])){
				if(constructs[i].includes("#") && (aggregatesRegex.test(constructs[i]) == aggregatesRegex.test(constructs[i]))){
					//TODO BUG il .test diventa true all'interno di questo if pur essendo false all'esterno
					//console.log("1)!aggregatesRegex.test(" + constructs[i] + ") = ", !aggregatesRegex.test(constructs[i]));
					diagnostics.push(createDiagnostic(doc, lineOfText, lineIndex, "001"));
					console.log(constructs[i] + " is not a correct aggregate ");
					//console.log("2)!aggregatesRegex.test(" + constructs[i] + ") = ", !aggregatesRegex.test(constructs[i]));
					continue;
				}
				//Controllo built-ins
				else if(constructs[i].includes("&") && !builtInRegex.test(constructs[i])){
					//TODO BUG il .test diventa true all'interno di questo if pur essendo false all'esterno
					diagnostics.push(createDiagnostic(doc, lineOfText, lineIndex, "010"));
					console.log(constructs[i] + " is not a correct built-in ");
					continue;
				}
			}
		}
	}

	emojiDiagnostics.set(doc.uri, diagnostics);
}

function parseRule(lineOfText : string){
	//console.log("-----parsing rule " + lineOfText + "-----");
	if(lineOfText==""){ //TODO gestire se ci sono spazi ma è comunque vuota
		return [];
	}
	let constructs: string[] = [];
	//Divide la testa e la coda che verranno poi parsizzate separatamente siccome usano
	//separatori diversi (ovvero | per una e , per l'altra
	//Splitta in due la regola
	const headAndTail = lineOfText.split(":-");

	//parsing della testa
	const headConstructs = parseHead(headAndTail[0]);
	//parsing della coda
	const tailConstructs = parseTail(headAndTail[1]);
	//console.log("headConstructs = " + headConstructs);
	//console.log("tailConstructs = " + tailConstructs);

	//Se la testa è vuota si considera solo la coda
	//Se la coda è vuota si considera solo la testa
	//Altrimenti si concatenano le due
	if(headConstructs[0]==''){
		constructs = tailConstructs;
	} else if(tailConstructs[0]==''){
		constructs = headConstructs;
	} else {
	constructs = headConstructs.concat(tailConstructs);
	}


	console.log("constructs = ", constructs);
	return constructs;
}

//Funzione di utilità sostituisce all'interno di una string un carattere ad un certo indice
function setCharAt(str:string,index:number,chr:string) {
    if(index > str.length-1) return str;
    return str.substring(0,index) + chr + str.substring(index+1);
}

//Fa il parsing della coda
function parseTail(tail:string){
	let tailCopy = tail;
	//Gestione caso in cui ci sono spazi dopo il . finale
	const str:string[] = tailCopy.split(".");
	if(str[1]!=undefined && !str[1].replace(/\s/g, '').length) { //TODO spazi
	tailCopy = tailCopy.substring(0, tailCopy.length-1); //Rimuove il punto
	} else {
		return [];
	}
	//console.log("tail = ", tailCopy);
	//Sostituiamo tutte le virgole che sono all'interno delle parentesi con il carattere speciale £
	for(let i=0; i<tailCopy.length;i++){
		//console.log("tailCopy[" + i + "] = ", tailCopy[i]);
		if(tailCopy[i]=="(" ){
			//console.log("( trovata");
			for(let j=i;j<tailCopy.length;j++){
				if(tailCopy[j]==")"){
					//console.log(") trovata");
					break;
				}
				if(tailCopy[j]==","){
					//console.log(", trovata");
					tailCopy = setCharAt(tailCopy, j, '£');
					//console.log("tailCopy[j] = ", tailCopy[j]);
					continue;
				}
			}
		}
		if(tailCopy[i]=="{" ){
			//console.log("( trovata");
			for(let j=i;j<tailCopy.length;j++){
				if(tailCopy[j]=="}"){
					//console.log(") trovata");
					break;
				}
				if(tailCopy[j]==","){
					//console.log(", trovata");
					tailCopy = setCharAt(tailCopy, j, '£');
					//console.log("tailCopy[j] = ", tailCopy[j]);
					continue;
				}
			}
		}
	}
	//console.log("tailCopy = ", tailCopy);

	//Facciamo il parsing per , sapendo che non ci sono più , all'interno delle parentesi
	const tailParsed = tailCopy.split(",");

	//Adesso sostituiamo il placeholder £ con le virgole in ogni costrutto
	for(let i=0; i<tailParsed.length;i++){
		//console.log(tailParsed[i]);
		tailParsed[i] = tailParsed[i].replaceAll("£", ",");
		//console.log(tailParsed[i]);
	}
	//console.log("tailParsed = ", tailParsed);
	return tailParsed;
}

//Fa il parsing della testa
function parseHead(head:string){
	let headCopy = head;
	//console.log("head = ", headCopy);
	//Sostituiamo tutte le | che sono all'interno delle parentesi con il carattere speciale £
	for(let i=0; i<headCopy.length;i++){
		//console.log("headCopy[" + i + "] = ", headCopy[i]);
		if(headCopy[i]=="["){
			//console.log("[ trovata");
			for(let j=i;j<headCopy.length;j++){
				if(headCopy[j]=="]"){
					//console.log("] trovata");
					break;
				}
				if(headCopy[j]=="|"){
					//console.log("| trovata");
					headCopy = setCharAt(headCopy, j, '£');
					//console.log("headCopy[j] = ", headCopy[j]);
					continue;
				}
			}
		}
	}
	//console.log("headCopy = ", headCopy);
	//Facciamo il parsing per | sapendo che non ci sono più , all'interno delle parentesi
	const headParsed = headCopy.split("|");
	//Adesso sostituiamo il placeholder £ con le virgole in ogni costrutto
	for(let i=0; i<headParsed.length;i++){
		//console.log(headParsed[i]);
		headParsed[i] = headParsed[i].replaceAll("£", "|");
		//console.log(headParsed[i]);
	}
	//console.log("headParsed = ", headParsed);
	return headParsed;
}

//Crea una diagnostica, ovvero un oggetto di vscode che indica che errore c'è stato
function createDiagnostic(doc: vscode.TextDocument, lineOfText: vscode.TextLine, lineIndex: number, codeError: string): vscode.Diagnostic {
	
	const index = lineOfText.text.indexOf(END_CHARACTER_OF_A_RULE);

	const range = new vscode.Range(lineIndex, 0, lineIndex, 0 + lineOfText.text.length);
	const diagnostic = new vscode.Diagnostic(range, "Format incorrect.",
	vscode.DiagnosticSeverity.Error);
	//In questa sezione di codice si inferisce qual'è la causa dell'errore
	//Modifica il messaggio d'errore in base alla causa dell'errore
	if(codeError == "001"){ 
		diagnostic.message = "The format of the aggregate is incorrect.";
		diagnostic.code = "001";
	}
	else if(codeError == "010"){
		diagnostic.message = "The format of the built-in is incorrect";
		diagnostic.code = "010";
	}
	
	return diagnostic;
}

export function subscribeToDocumentChanges(context: vscode.ExtensionContext, emojiDiagnostics: vscode.DiagnosticCollection): void {
	if (vscode.window.activeTextEditor) {
		refreshDiagnostics(vscode.window.activeTextEditor.document, emojiDiagnostics);
	}
	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor(editor => {
			if (editor) {
				refreshDiagnostics(editor.document, emojiDiagnostics);
			}
		})
	);

	context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument(e => refreshDiagnostics(e.document, emojiDiagnostics))
	);

	context.subscriptions.push(
		vscode.workspace.onDidCloseTextDocument(doc => emojiDiagnostics.delete(doc.uri))
	);

}
