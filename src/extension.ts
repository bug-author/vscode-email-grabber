import * as vscode from "vscode";
import * as path from "path";

const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "email-grabber.grabEmails",
    grabEmailsFromAllFiles
  );
  context.subscriptions.push(disposable);
}

async function grabEmailsFromAllFiles() {
  let allEmails: string[] = [];
  const files = await vscode.workspace.findFiles("**/*");

  for (const file of files) {
    try {
      const document = await vscode.workspace.openTextDocument(file);
      const text = document.getText();
      const emails = text.match(EMAIL_REGEX) || [];
      allEmails = allEmails.concat(emails);
    } catch (error) {
      console.error(`Error processing ${file.fsPath}:`, error);
    }
  }

  const uniqueEmails = [...new Set(allEmails)];

  if (uniqueEmails.length === 0) {
    vscode.window.showInformationMessage(
      "No email addresses found in the workspace."
    );
    return;
  }

  const emailList = uniqueEmails.join("\n");
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

  if (!workspaceFolder) {
    vscode.window.showErrorMessage("Please open a folder and try again.");
    return;
  }

  const filePath = path.join(workspaceFolder.uri.fsPath, "grabResult.txt");
  const fileUri = vscode.Uri.file(filePath);

  try {
    await vscode.workspace.fs.writeFile(
      fileUri,
      Buffer.from(emailList, "utf8")
    );
    const document = await vscode.workspace.openTextDocument(fileUri);
    await vscode.window.showTextDocument(document);
    await vscode.env.clipboard.writeText(emailList);
    vscode.window.showInformationMessage(
      `${uniqueEmails.length} email(s) found and saved to grabResult.txt!`
    );
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to save emails: ${error}`);
  }
}

export function deactivate() {}
