import type { ComponentPropsWithoutRef } from 'react';
import { SavedDocumentScope } from './saved-document-scope';
import type { SavedDocumentControls } from './use-document-state';
import { PrintSavePrompt } from './print-save-prompt';

export const SavedDocumentPage = ({
  document,
  onSave,
  children,
  ...props
}: ComponentPropsWithoutRef<'main'> & {
  document: Pick<SavedDocumentControls, 'mode' | 'hasChanges'>;
  onSave: () => Promise<boolean>;
}) => (
  <SavedDocumentScope value={document.mode !== 'draft'}>
    <main {...props} data-document-mode={document.mode}>
      {children}
      <PrintSavePrompt
        canSave={document.mode === 'draft' || document.hasChanges}
        editing={document.mode === 'edit'}
        onSave={onSave}
      />
    </main>
  </SavedDocumentScope>
);
