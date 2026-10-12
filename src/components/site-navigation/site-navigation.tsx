type Props = {
  current: 'protocol' | 'registration';
};

export const SiteNavigation = ({ current }: Props) => (
  <nav className="site-navigation" aria-label="Разделы сайта">
    <a
      href="#/protocol"
      className={current === 'protocol' ? 'site-navigation__link is-active' : 'site-navigation__link'}
      aria-current={current === 'protocol' ? 'page' : undefined}
    >
      Протокол трансфузии
    </a>
    <a
      href="#/registration"
      className={
        current === 'registration' ? 'site-navigation__link is-active' : 'site-navigation__link'
      }
      aria-current={current === 'registration' ? 'page' : undefined}
    >
      Лист регистрации трансфузий
    </a>
  </nav>
);
