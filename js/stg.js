(() => {
    window.modSC2DataManager.getModLoadController().addLifeTimeCircleHook(
        'strangeGarden',
        {
            ModLoaderLoadEnd: async () => {
                const logger = window.modUtils.getLogger();
                const maplebirchMod = window.modUtils.getMod('maplebirch');
                const simpleMod = window.modUtils.getMod('Simple Frameworks');

                if (maplebirchMod) {
                    maplebirchFrameworks.addto('CustomLinkZone', {
                        widget: [1, 'strangeGarden_link'], // 在链接位置2前插入
                        passage: ['Elk Street'],
                    });
                    logger.log('[strange garden] Maplebirch 已註冊連結');
                } else if (simpleMod) {
                    simpleFrameworks.addto('BeforeLinkZone', {
                        passage: ['Elk Street'],
                        widget: 'strangeGarden_link',
                    });
                    logger.log('[strange garden] Simple Frameworks 已註冊連結');
                } else {
                    logger.error('[strange garden] 未檢測到 Maplebirch 或 Simple Frameworks');
                }
            },
        }
    );
})();