/**
 * Copyright 2023-present DreamNum Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { LocaleService, ThemeService } from '@univerjs/core';
import type { ILocale } from '@univerjs/design';
import { ConfigProvider, defaultTheme, themeInstance } from '@univerjs/design';
import { useDependency } from '@wendellhu/redi/react-bindings';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { IWorkbenchOptions } from '../controllers/ui/ui.controller';
import { IMessageService } from '../services/message/message.service';
import { BuiltInUIPart, IUIPartsService } from '../services/parts/parts.service';
import styles from './app.module.less';
import { ComponentContainer } from './components/ComponentContainer';
import { Toolbar } from './components/doc-bars/Toolbar';
import { Sidebar } from './components/sidebar/Sidebar';
import { ZenZone } from './components/zen-zone/ZenZone';
import { CanvasPopup } from './components/popup';
import { builtInGlobalComponents } from './parts';
import { ContextMenu } from './components/context-menu/ContextMenu';

export interface IUniverAppProps extends IWorkbenchOptions {
    mountContainer: HTMLElement;

    onRendered?: (container: HTMLElement) => void;
}

export function App(props: IUniverAppProps) {
    const {
        header = true,
        footer = true,
        contextMenu = true,
        mountContainer,
        onRendered,
    } = props;

    const localeService = useDependency(LocaleService);
    const themeService = useDependency(ThemeService);
    const messageService = useDependency(IMessageService);
    const contentRef = useRef<HTMLDivElement>(null);

    const uiPartsService = useDependency(IUIPartsService);

    const [updateTrigger, setUpdateTrigger] = useState(false);

    useEffect(() => {
        const updateSubscription = uiPartsService.componentRegistered$.subscribe(() => {
            setUpdateTrigger((prev) => !prev);
        });

        return () => {
            updateSubscription.unsubscribe();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const { headerComponents, contentComponents, footerComponents, headerMenuComponents, leftSidebarComponents, globalComponents } = useMemo(() => ({
        headerComponents: uiPartsService.getComponents(BuiltInUIPart.HEADER),
        contentComponents: uiPartsService.getComponents(BuiltInUIPart.CONTENT),
        footerComponents: uiPartsService.getComponents(BuiltInUIPart.FOOTER),
        headerMenuComponents: uiPartsService.getComponents(BuiltInUIPart.HEADER_MENU),
        leftSidebarComponents: uiPartsService.getComponents(BuiltInUIPart.LEFT_SIDEBAR),
        globalComponents: uiPartsService.getComponents(BuiltInUIPart.GLOBAL),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [updateTrigger]);

    useEffect(() => {
        if (!themeService.getCurrentTheme()) {
            themeService.setTheme(defaultTheme);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (contentRef.current) {
            onRendered?.(contentRef.current);
        }
    }, [onRendered]);

    const [locale, setLocale] = useState<ILocale>(localeService.getLocales() as unknown as ILocale);

    // Create a portal container for injecting global component themes.
    const portalContainer = useMemo<HTMLElement>(() => document.createElement('div'), []);

    useEffect(() => {
        document.body.appendChild(portalContainer);
        messageService.setContainer(portalContainer);

        const subscriptions = [
            localeService.localeChanged$.subscribe(() => {
                setLocale(localeService.getLocales() as unknown as ILocale);
            }),
            themeService.currentTheme$.subscribe((theme) => {
                themeInstance.setTheme(mountContainer, theme);
                portalContainer && themeInstance.setTheme(portalContainer, theme);
            }),
        ];

        return () => {
            // batch unsubscribe
            subscriptions.forEach((subscription) => subscription.unsubscribe());

            // cleanup
            document.body.removeChild(portalContainer);
        };
    }, [localeService, messageService, mountContainer, portalContainer, themeService.currentTheme$]);

    return (
        <ConfigProvider locale={locale} mountContainer={portalContainer}>
            {/**
              * IMPORTANT! This `tabIndex` should not be moved. This attribute allows the element to catch
              * all focusin event merged from its descendants. The DesktopLayoutService would listen to focusin events
              * bubbled to this element and refocus the input element.
              */}
            <div className={styles.appLayout} tabIndex={-1} onBlur={(e) => e.stopPropagation()}>
                {/* header */}
                {header && (
                    <header className={styles.appContainerHeader}>
                        <Toolbar headerMenuComponents={headerMenuComponents} />
                    </header>
                )}

                {/* content */}
                <section className={styles.appContainer}>
                    <div className={styles.appContainerWrapper}>
                        <aside className={styles.appContainerLeftSidebar}>
                            <ComponentContainer components={leftSidebarComponents} />
                        </aside>

                        <section className={styles.appContainerContent}>
                            <header>
                                {header && <ComponentContainer components={headerComponents} />}
                            </header>

                            <section
                                className={styles.appContainerCanvas}
                                ref={contentRef}
                                data-range-selector
                                onContextMenu={(e) => e.preventDefault()}
                            >
                                <CanvasPopup />
                                <ComponentContainer components={contentComponents} />
                            </section>
                        </section>

                        <aside className={styles.appContainerSidebar}>
                            <Sidebar />
                        </aside>
                    </div>

                    {/* footer */}
                    {footer && (
                        <footer className={styles.appFooter}>
                            <ComponentContainer components={footerComponents} />
                        </footer>
                    )}

                    <ZenZone />
                </section>
            </div>
            <ComponentContainer components={globalComponents} />
            <ComponentContainer components={builtInGlobalComponents} />
            {contextMenu && <ContextMenu />}
        </ConfigProvider>
    );
}
