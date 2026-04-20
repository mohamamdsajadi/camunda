/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH under
 * one or more contributor license agreements. See the NOTICE file distributed
 * with this work for additional information regarding copyright ownership.
 * Licensed under the Camunda License 1.0. You may not use this file
 * except in compliance with the Camunda License 1.0.
 */

import {useEffect, useState} from 'react';
import {observer} from 'mobx-react-lite';
import {Link} from 'react-router-dom';
import {
  Dropdown,
  Layer,
  type OnChangeData,
  SwitcherDivider,
} from '@carbon/react';
import {ArrowRight} from '@carbon/react/icons';
import {C3Navigation} from '@camunda/camunda-composite-components';
import {Locations, Paths} from 'modules/Routes';
import {tracking} from 'modules/tracking';
import {authenticationStore} from 'modules/stores/authentication';
import {useCurrentPage} from 'modules/hooks/useCurrentPage';
import {licenseTagStore} from 'modules/stores/licenseTag';
import {currentTheme} from 'modules/stores/currentTheme';
import {useCurrentUser} from 'modules/queries/useCurrentUser';
import {isForbidden} from 'modules/auth/isForbidden';
import {getClientConfig} from 'modules/utils/getClientConfig';
import {notificationsStore} from 'modules/stores/notifications';
import {
  languageItems,
  type SelectionOption,
  useTranslation,
  translate as t,
} from 'modules/i18n';
import styles from './styles.module.scss';

function getInfoSidebarItems(isPaidPlan: boolean) {
  const BASE_INFO_SIDEBAR_ITEMS = [
    {
      key: 'docs',
      label: t('headerSidebarDocumentationLink'),
      onClick: () => {
        tracking.track({
          eventName: 'info-bar',
          link: 'documentation',
        });

        window.open('https://docs.camunda.io/', '_blank');
      },
    },
    {
      key: 'academy',
      label: t('headerSidebarCamundaAcademyLink'),
      onClick: () => {
        tracking.track({
          eventName: 'info-bar',
          link: 'academy',
        });

        window.open('https://academy.camunda.com/', '_blank');
      },
    },
  ];
  const FEEDBACK_AND_SUPPORT_ITEM = {
    key: 'feedbackAndSupport',
    label: t('headerSidebarFeedbackAndSupportLink'),
    onClick: () => {
      tracking.track({
        eventName: 'info-bar',
        link: 'feedback',
      });

      window.open('https://jira.camunda.com/projects/SUPPORT/queues', '_blank');
    },
  } as const;
  const COMMUNITY_FORUM_ITEM = {
    key: 'communityForum',
    label: t('headerSidebarCommunityForumLink'),
    onClick: () => {
      tracking.track({
        eventName: 'info-bar',
        link: 'forum',
      });

      window.open('https://forum.camunda.io', '_blank');
    },
  };

  return isPaidPlan
    ? [
        ...BASE_INFO_SIDEBAR_ITEMS,
        FEEDBACK_AND_SUPPORT_ITEM,
        COMMUNITY_FORUM_ITEM,
      ]
    : [...BASE_INFO_SIDEBAR_ITEMS, COMMUNITY_FORUM_ITEM];
}

const NAVBAR_LG_BREAKPOINT = '(min-width: 66rem)';

const LOGOUT_DELAY = 1000;

const AppHeader: React.FC = observer(() => {
  const {t} = useTranslation();
  const {data: currentUser} = useCurrentUser();
  const clientConfig = getClientConfig();
  const IS_SAAS = typeof clientConfig.organizationId === 'string';
  const {currentPage} = useCurrentPage();
  const {theme, changeTheme} = currentTheme;
  const [isAppBarOpen, setIsAppBarOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(
    () => window.matchMedia(NAVBAR_LG_BREAKPOINT).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(NAVBAR_LG_BREAKPOINT);
    const handler = (e: MediaQueryListEvent) => setIsLargeScreen(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (currentUser !== undefined) {
      tracking.identifyUser({
        username: currentUser.username,
        salesPlanType: currentUser.salesPlanType,
        roles: currentUser.roles,
      });
    }
  }, [currentUser]);

  useEffect(() => {
    licenseTagStore.fetchLicense();

    return licenseTagStore.reset;
  }, []);

  const logoutWithNotification = async () => {
    notificationsStore.displayNotification({
      kind: 'info',
      title: t('notificationLogOutTitle'),
      subtitle: t('notificationLogOutSubtitle'),
      isDismissable: true,
    });
    return setTimeout(authenticationStore.handleLogout, LOGOUT_DELAY);
  };

  return (
    <C3Navigation
      toggleAppbar={(isAppBarOpen) => setIsAppBarOpen(isAppBarOpen)}
      notificationSideBar={IS_SAAS ? {} : undefined}
      appBar={{
        ariaLabel: t('headerAppBarLabel'),
        isOpen: isAppBarOpen,
        elementClicked: (app: string) => {
          tracking.track({
            eventName: 'app-switcher-item-clicked',
            app,
          });
        },
        appTeaserRouteProps: IS_SAAS ? {} : undefined,
        elements: IS_SAAS ? undefined : [],
      }}
      app={{
        ariaLabel: 'Camunda Operate',
        name: 'Operate',
        routeProps: {
          to: Paths.dashboard(),
          onClick: () => {
            tracking.track({
              eventName: 'navigation',
              link: 'header-logo',
            });
          },
        },
      }}
      forwardRef={Link}
      navbar={{
        elements: isForbidden(currentUser)
          ? []
          : [
              {
                key: 'dashboard',
                label: t('headerNavItemDashboard'),
                isCurrentPage: currentPage === 'dashboard',
                routeProps: {
                  to: Paths.dashboard(),
                  onClick: () => {
                    tracking.track({
                      eventName: 'navigation',
                      link: 'header-dashboard',
                      currentPage,
                    });
                  },
                },
              },
              {
                key: 'processes',
                label: t('headerNavItemProcesses'),
                isCurrentPage:
                  currentPage === 'processes' ||
                  currentPage?.startsWith('process-details') === true,
                routeProps: {
                  to: Locations.processes(),
                  state: {refreshContent: true, hideOptionalFilters: true},
                  onClick: () => {
                    tracking.track({
                      eventName: 'navigation',
                      link: 'header-processes',
                      currentPage,
                    });
                  },
                },
              },
              {
                key: 'decisions',
                label: t('headerNavItemDecisions'),
                isCurrentPage:
                  currentPage === 'decisions' ||
                  currentPage === 'decision-details',
                routeProps: {
                  to: Locations.decisions(),
                  state: {refreshContent: true, hideOptionalFilters: true},
                  onClick: () => {
                    tracking.track({
                      eventName: 'navigation',
                      link: 'header-decisions',
                      currentPage,
                    });
                  },
                },
              },
              ...(isLargeScreen
                ? [
                    {
                      key: 'operations',
                      label: t('headerNavItemOperations'),
                      isCurrentPage:
                        currentPage === 'batch-operations' ||
                        currentPage === 'operations-log',
                      subElements: [
                        {
                          key: 'batch-operations',
                          label: t('headerNavItemBatchOperations'),
                          isCurrentPage: currentPage === 'batch-operations',
                          routeProps: {
                            to: Paths.batchOperations(),
                            onClick: () => {
                              tracking.track({
                                eventName: 'navigation',
                                link: 'header-batch-operations',
                                currentPage,
                              });
                              (document.activeElement as HTMLElement)?.blur();
                            },
                          },
                        },
                        {
                          key: 'operations-log',
                          label: t('headerNavItemOperationsLog'),
                          isCurrentPage: currentPage === 'operations-log',
                          routeProps: {
                            to: Paths.operationsLog(),
                            onClick: () => {
                              tracking.track({
                                eventName: 'navigation',
                                link: 'header-operations-log',
                                currentPage,
                              });
                              (document.activeElement as HTMLElement)?.blur();
                            },
                          },
                        },
                      ],
                    },
                  ]
                : [
                    {
                      key: 'batch-operations',
                      label: t('headerNavItemBatchOperations'),
                      isCurrentPage: currentPage === 'batch-operations',
                      routeProps: {
                        to: Paths.batchOperations(),
                        onClick: () => {
                          tracking.track({
                            eventName: 'navigation',
                            link: 'header-batch-operations',
                            currentPage,
                          });
                        },
                      },
                    },
                    {
                      key: 'operations-log',
                      label: t('headerNavItemOperationsLog'),
                      isCurrentPage: currentPage === 'operations-log',
                      routeProps: {
                        to: Paths.operationsLog(),
                        onClick: () => {
                          tracking.track({
                            eventName: 'navigation',
                            link: 'header-operations-log',
                            currentPage,
                          });
                        },
                      },
                    },
                  ]),
            ],
        licenseTag: {
          show: licenseTagStore.state.isTagVisible,
          isProductionLicense: licenseTagStore.state.isProductionLicense,
          isCommercial: licenseTagStore.state.isCommercial,
          expiresAt: licenseTagStore.state.expiresAt,
        },
      }}
      infoSideBar={{
        isOpen: false,
        ariaLabel: t('headerInfoLabel'),
        elements: getInfoSidebarItems(
          typeof currentUser?.salesPlanType === 'string' &&
            ['paid-cc', 'enterprise'].includes(currentUser.salesPlanType),
        ),
      }}
      userSideBar={{
        ariaLabel: t('headerSettingsLabel'),
        version: import.meta.env.VITE_VERSION,
        customElements: {
          profile: {
            label: t('headerProfileLabel'),
            user: {
              name: currentUser?.displayName ?? '',
              email: currentUser?.email ?? '',
            },
          },
          themeSelector: {
            currentTheme: theme,
            onChange: (theme: string) => {
              changeTheme(theme as 'system' | 'dark' | 'light');
            },
          },
          customSection: <LanguageSelector />,
        },
        elements: [
          ...(window.Osano?.cm === undefined
            ? []
            : [
                {
                  key: 'cookie',
                  label: t('headerCookiePreferencesLabel'),
                  onClick: () => {
                    tracking.track({
                      eventName: 'user-side-bar',
                      link: 'cookies',
                    });

                    window.Osano?.cm?.showDrawer(
                      'osano-cm-dom-info-dialog-open',
                    );
                  },
                },
              ]),
          {
            key: 'terms',
            label: t('headerTermsOfUseLabel'),
            onClick: () => {
              tracking.track({
                eventName: 'user-side-bar',
                link: 'terms-conditions',
              });

              window.open(
                'https://camunda.com/legal/terms/camunda-platform/camunda-platform-8-saas-trial/',
                '_blank',
              );
            },
          },
          {
            key: 'privacy',
            label: t('headerPrivacyPolicyLabel'),
            onClick: () => {
              tracking.track({
                eventName: 'user-side-bar',
                link: 'privacy-policy',
              });

              window.open('https://camunda.com/legal/privacy/', '_blank');
            },
          },
          {
            key: 'imprint',
            label: t('headerImprintLabel'),
            onClick: () => {
              tracking.track({
                eventName: 'user-side-bar',
                link: 'imprint',
              });

              window.open('https://camunda.com/legal/imprint/', '_blank');
            },
          },
        ],
        bottomElements: clientConfig.canLogout
          ? [
              {
                key: 'logout',
                label: t('headerLogOutLabel'),
                renderIcon: ArrowRight,
                kind: 'ghost',
                onClick: logoutWithNotification,
              },
            ]
          : undefined,
      }}
    />
  );
});

const LanguageSelector: React.FC = observer(() => {
  const {i18n, t} = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    i18n.resolvedLanguage ?? 'en',
  );

  useEffect(() => {
    if (selectedLanguage !== i18n.language) {
      i18n.changeLanguage(selectedLanguage);
      localStorage.setItem('language', selectedLanguage);
    }
  }, [selectedLanguage, i18n]);

  const handleLanguageChange = (e: OnChangeData<SelectionOption>) => {
    setSelectedLanguage(e.selectedItem?.id ?? 'en');
  };

  return (
    <Layer>
      <SwitcherDivider />
      <div className={styles['languageDropdownPadding']}>
        <Dropdown
          id="language-dropdown"
          label={t('languageSelectorLabel')}
          titleText={t('languageSelectorTitle')}
          items={languageItems}
          itemToString={(item) => (item ? item.label : '')}
          onChange={handleLanguageChange}
          selectedItem={languageItems.find(
            (item) => item.id === selectedLanguage,
          )}
        />
      </div>
    </Layer>
  );
});

export {AppHeader};
