import type { ComponentPropsWithoutRef } from 'react';
import { SavedDocumentScope } from './saved-document-scope';
import type { SavedDocumentControls } from './use-document-state';
import { PrintSavePrompt } from './print-save-prompt';
import { usePrintKeyboardBlock } from './use-print-keyboard-block';

export const SavedDocumentPage = ({
  document,
  hasContent,
  onSave,
  children,
  ...props
}: ComponentPropsWithoutRef<'main'> & {
  document: Pick<SavedDocumentControls, 'mode' | 'hasChanges'> & { workingHasChanges?: boolean };
  hasContent: boolean;
  onSave: () => Promise<boolean>;
}) => {
  usePrintKeyboardBlock();
  return (
    <SavedDocumentScope value={document.mode !== 'draft'}>
      <main {...props} data-document-mode={document.mode}>
        {children}
        <PrintSavePrompt
          canSave={
            hasContent &&
            (document.mode === 'draft' ? document.workingHasChanges !== false : document.hasChanges)
          }
          editing={document.mode === 'edit'}
          onSave={onSave}
        />
      </main>
    </SavedDocumentScope>
  );
};
