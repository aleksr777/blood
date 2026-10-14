type Props = {
  current: 'protocol' | 'registration';
  recipientName?: string;
  recipientAbo?: string;
  recipientRh?: string;
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
];

export const SiteNavigation = ({
  current,
  recipientName = '',
  recipientAbo = '',
  recipientRh = '',
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

        <div
          className={`current-recipient-summary${name ? '' : ' current-recipient-summary--empty'}`}
          title={name ? `Текущий реципиент: ${name}` : 'Текущий реципиент не выбран'}
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
        </div>
      </div>
    </div>
  );
};
