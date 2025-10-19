import React, { useState } from 'react';

export type MobileNavItem = {
  key: string;
  label: string;
  href: string;
  icon: React.ReactNode;
};

export type ExtendedNavLink = {
  key: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
};

export interface MobileNavProps {
  items: MobileNavItem[];
  extendedLinks?: ExtendedNavLink[];
  activeKey: string;
  onNavigate: (key: string, href: string) => boolean | void;
}

const MobileNav: React.FC<MobileNavProps> = ({
  items,
  extendedLinks = [],
  activeKey,
  onNavigate,
}) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleItemClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    item: MobileNavItem,
  ) => {
    const result = onNavigate(item.key, item.href);
    if (result !== false) {
      event.preventDefault();
    }
  };

  const handleExtendedClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    link: ExtendedNavLink,
  ) => {
    const result = onNavigate(link.key, link.href);
    if (result !== false) {
      event.preventDefault();
      setIsSheetOpen(false);
    }
  };

  const toggleSheet = () => {
    setIsSheetOpen((previous) => !previous);
  };

  return (
    <div className="mobile-nav" data-expanded={isSheetOpen}>
      <nav className="mobile-nav__bar" aria-label="Primary mobile navigation">
        {items.map((item) => (
          <a
            key={item.key}
            href={item.href}
            className={`mobile-nav__item${
              activeKey === item.key ? ' is-active' : ''
            }`}
            aria-current={activeKey === item.key ? 'page' : undefined}
            onClick={(event) => handleItemClick(event, item)}
          >
            <span className="mobile-nav__icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="mobile-nav__label">{item.label}</span>
          </a>
        ))}

        {extendedLinks.length > 0 && (
          <button
            type="button"
            className="mobile-nav__item mobile-nav__item--more"
            aria-expanded={isSheetOpen}
            aria-controls="mobile-nav-more"
            onClick={toggleSheet}
          >
            <span className="mobile-nav__icon" aria-hidden="true">
              ☰
            </span>
            <span className="mobile-nav__label">More</span>
          </button>
        )}
      </nav>

      {extendedLinks.length > 0 && (
        <div
          id="mobile-nav-more"
          className={`mobile-nav__sheet${isSheetOpen ? ' is-open' : ''}`}
          role="menu"
          aria-label="More navigation destinations"
        >
          {extendedLinks.map((link) => (
            <a
              key={link.key}
              href={link.href}
              className="mobile-nav__sheet-link"
              role="menuitem"
              onClick={(event) => handleExtendedClick(event, link)}
            >
              {link.icon && (
                <span className="mobile-nav__sheet-icon" aria-hidden="true">
                  {link.icon}
                </span>
              )}
              <span className="mobile-nav__sheet-label">{link.label}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default MobileNav;
