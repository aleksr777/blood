type Props = {
  current: 'protocol' | 'registration';
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

export const SiteNavigation = ({ current }: Props) => (
  <div className="site-navigation-block">
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
);
