import ui from '../../styles/ui';

type Props = {
  current: 'protocol' | 'registration' | 'summary-request' | 'component-request';
  recipientName?: string;
  recipientAbo?: string;
  recipientRh?: string;
  currentRecipientAvailable?: boolean;
  onOpenCurrentRecipient?: () => void;
  onOpenRecipients: () => void;
  showRecipient?: boolean;
};

type NavigationItem = {
  id: Props['current'];
  href: string;
  label: string;
};

const items: NavigationItem[] = [
  {
    id: 'protocol',
    href: '#/protocol',
    label: 'Протокол трансфузии',
  },
  {
    id: 'registration',
    href: '#/registration',
    label: 'Лист регистрации трансфузий',
  },
  {
    id: 'component-request',
    href: '#/component-request',
    label: 'Заявка в трансфузиологический кабинет',
  },
  {
    id: 'summary-request',
    href: '#/summary-request',
    label: 'Направление на индивидуальный подбор',
  },
];

export const SiteNavigation = ({
  current,
  recipientName = '',
  recipientAbo = '',
  recipientRh = '',
  currentRecipientAvailable = false,
  onOpenCurrentRecipient,
  onOpenRecipients,
  showRecipient = true,
}: Props) => {
  const name = recipientName.trim();
  const bloodGroup = [recipientAbo.trim(), recipientRh.trim()].filter(Boolean).join(' ');

  return (
    <div className="site-navigation-block">
      <div className="site-navigation-row">
        <nav className="site-navigation" aria-label="Разделы сайта">
          {items.map((item) =>
            item.id === current ? (
              <span
                key={item.id}
                className="site-navigation__link site-navigation__link--current"
                aria-current="page"
              >
                {item.label}
              </span>
            ) : (
              <a key={item.id} href={item.href} className="site-navigation__link">
                {item.label}
              </a>
            ),
          )}
        </nav>
      </div>

      <div className="site-current-recipient-row">
        {showRecipient && (
          <button
            type="button"
            className={`current-recipient-summary${name ? '' : ' current-recipient-summary--empty'}`}
            title={name ? `Текущий реципиент: ${name}` : 'Текущий реципиент не выбран'}
            disabled={!currentRecipientAvailable}
            onClick={onOpenCurrentRecipient}
          >
            <span className="current-recipient-summary__label">Текущий реципиент:</span>
            {name ? (
              <>
                <strong className="current-recipient-summary__name">{name}</strong>
                {bloodGroup && (
                  <span className="current-recipient-summary__blood-group">{bloodGroup}</span>
                )}
              </>
            ) : (
              <span className="current-recipient-summary__empty">не выбран</span>
            )}
          </button>
        )}
        <button
          type="button"
          className={`${ui.secondaryButton} ${ui.toolbarButton} secondary-button`}
          onClick={onOpenRecipients}
        >
          Реципиенты
        </button>
      </div>
    </div>
  );
};
