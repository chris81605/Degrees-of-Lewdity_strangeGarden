/* ==============================
 * CE Strange Garden Foodstuff Compat
 *
 * 目的：
 * - 舊版：setup.plants + $plants，完全維持原流程
 * - 新版：setup.foodstuff + $foodstuff
 *   1. 只把完整 tending 資料轉成相容用 setup.plants
 *   2. 可從 setup.SG_OldPlants 補舊版 setup.plants 資料
 *   3. 舊農場 widget 照常讀 setup.plants
 *   4. 收成時寫入 $foodstuff
 *   5. 清除 $plants 暫存，避免新版殘留舊資料
 *
 * 初始化：
 * - 等待 StartConfig.version 可用後再判斷遊戲版本
 * - 舊版：直接初始化
 * - 0.5.10.12+：
 *   等待原版 setup.foodstuff 真正初始化完成後，
 *   才執行 Foodstuff 相容邏輯
 *
 * 注意：
 * - 部分框架可能會預先建立空的 setup.foodstuff = {}
 * - 因此「物件存在」不代表原版 foodstuff 已初始化完成
 * - 新版只有在 setup.foodstuff 為非空普通物件時才視為 ready
 * ============================== */

(function () {
    "use strict";

    /* =========================================================
     * 設定
     * ========================================================= */

    const FOODSTUFF_VERSION = "0.5.10.12";

    const INIT_CHECK_INTERVAL = 100;

    /*
     * StartConfig.version / setup.foodstuff 最長等待時間。
     * 正常情況應該很快就會完成，30 秒主要用來避免異常環境永久輪詢。
     */
    const INIT_TIMEOUT = 30 * 1000;


    /* =========================================================
     * Foodstuff Compat
     * ========================================================= */

    setup.SG_FoodCompat = {

        /*
         * 判斷目前是否已存在新版 foodstuff 資料模型。
         *
         * 注意：
         * 這個函式保留原本用途。
         * 真正的新舊遊戲版本判斷由 bootstrap 使用
         * StartConfig.version 負責。
         */
        isNewVersion() {
            return !!setup.foodstuff &&
                typeof setup.foodstuff === "object" &&
                !Array.isArray(setup.foodstuff);
        },

        isCompleteTending(tending) {
            return !!tending &&
                tending.planting_bed !== undefined &&
                tending.growth_days !== undefined &&
                tending.yield_multiplier !== undefined &&
                Array.isArray(tending.seasons);
        },

        convertOne(id, item) {
            if (!item || !item.tending) return null;

            const tending = item.tending;

            /*
             * 只轉換完整新版種植資料。
             *
             * 例如 bird_egg 只有
             * affected_by_tending_skill / tags，
             * 不應自動變成 earth / 5 天。
             *
             * Strange Garden 若允許此類物品種植，
             * 應由 SG_OldPlants / SG_CustomPlants
             * 提供真正的舊版種植資料。
             */
            if (!this.isCompleteTending(tending)) {
                return null;
            }

            return {
                index: item.index ?? 0,
                name: item.name || id,
                singular: item.singular || item.name || id,
                plural:
                    item.plural ||
                    item.singular ||
                    item.name ||
                    id,

                icon: item.icon || "",
                prop_folder: item.prop_folder || "tending",

                type: item.category || "misc",
                type_cn:
                    item.category_cn ||
                    item.category ||
                    "misc",

                category: item.category,
                category_cn: item.category_cn,

                bed: tending.planting_bed,
                days: Number(tending.growth_days) || 5,
                multiplier:
                    Number(tending.yield_multiplier ?? 1),

                season: tending.seasons.slice(),

                special: Array.isArray(tending.tags)
                    ? tending.tags.slice()
                    : [],

                has_seeds:
                    tending.has_seeds !== false,

                shop: item.shop || {}
            };
        },

        buildPlantsDbFromFoodstuff() {
            if (!this.isNewVersion()) return false;

            if (
                !setup.plants ||
                typeof setup.plants !== "object"
            ) {
                setup.plants = {};
            }

            let changed = false;

            for (const id in setup.foodstuff) {
                const converted =
                    this.convertOne(
                        id,
                        setup.foodstuff[id]
                    );

                if (!converted) continue;

                if (!setup.plants[id]) {
                    setup.plants[id] = converted;
                    changed = true;
                    continue;
                }

                const plant = setup.plants[id];

                if (plant.bed === undefined) {
                    plant.bed = converted.bed;
                }

                if (plant.days === undefined) {
                    plant.days = converted.days;
                }

                if (plant.multiplier === undefined) {
                    plant.multiplier =
                        converted.multiplier;
                }

                if (plant.season === undefined) {
                    plant.season =
                        converted.season;
                }

                if (plant.special === undefined) {
                    plant.special =
                        converted.special;
                }

                if (plant.icon === undefined) {
                    plant.icon =
                        converted.icon;
                }

                if (plant.prop_folder === undefined) {
                    plant.prop_folder =
                        converted.prop_folder;
                }

                if (plant.name === undefined) {
                    plant.name =
                        converted.name;
                }

                if (plant.singular === undefined) {
                    plant.singular =
                        converted.singular;
                }

                if (plant.plural === undefined) {
                    plant.plural =
                        converted.plural;
                }

                if (plant.type === undefined) {
                    plant.type =
                        converted.type;
                }

                if (plant.type_cn === undefined) {
                    plant.type_cn =
                        converted.type_cn;
                }

                if (plant.category === undefined) {
                    plant.category =
                        converted.category;
                }

                if (
                    plant.category_cn === undefined
                ) {
                    plant.category_cn =
                        converted.category_cn;
                }

                changed = true;
            }

            if (changed) {
                console.log(
                    "[SG_FoodCompat] " +
                    "setup.foodstuff -> setup.plants " +
                    "compat patched",
                    setup.plants
                );
            }

            return changed;
        },


        /*
         * 是否保留新版 foodstuff 已不存在的舊版作物。
         *
         * false：
         *   舊版資料若在新版 foodstuff 找不到，
         *   就不加入 setup.plants。
         *
         *   避免收成後寫入不存在的新版物品 id，
         *   造成遊戲異常。
         *
         * 注意：
         *   setup.SG_CustomPlants 內的資料
         *   視為手動確認過，仍會保留。
         */
        keepLegacyPlants: false,


        applyOldPlantsPatch() {
            if (!this.isNewVersion()) return false;

            const oldPlants =
                setup.SG_OldPlants || {};

            const customPlants =
                setup.SG_CustomPlants || {};

            const patch = Object.assign(
                {},
                oldPlants,
                customPlants
            );

            if (
                !patch ||
                typeof patch !== "object"
            ) {
                return false;
            }

            if (
                !setup.plants ||
                typeof setup.plants !== "object"
            ) {
                setup.plants = {};
            }

            let changed = false;

            for (const id in patch) {
                const oldPlant = patch[id];

                if (!oldPlant) continue;

                const food =
                    setup.foodstuff &&
                    setup.foodstuff[id];

                /*
                 * 若新版已不存在此物品，
                 * 依設定決定是否保留。
                 *
                 * SG_CustomPlants 視為使用者
                 * 明確確認過的資料，因此仍可保留。
                 */
                if (
                    !food &&
                    !this.keepLegacyPlants &&
                    !(id in customPlants)
                ) {
                    continue;
                }

                /*
                 * 舊版種植邏輯為主：
                 *
                 * - bed
                 * - days
                 * - multiplier
                 * - season
                 * - special
                 *
                 * 使用 SG_OldPlants / SG_CustomPlants。
                 *
                 * 新版 foodstuff 為顯示資料來源：
                 *
                 * - name
                 * - singular
                 * - plural
                 * - icon
                 * - prop_folder
                 * - category
                 */
                setup.plants[id] =
                    Object.assign(
                        {},
                        oldPlant,
                        {
                            index:
                                food &&
                                food.index !== undefined
                                    ? food.index
                                    : oldPlant.index,

                            name:
                                food && food.name
                                    ? food.name
                                    : (
                                        oldPlant.name ||
                                        id
                                    ),

                            singular:
                                food && food.singular
                                    ? food.singular
                                    : (
                                        oldPlant.singular ||
                                        oldPlant.name ||
                                        id
                                    ),

                            plural:
                                food && food.plural
                                    ? food.plural
                                    : (
                                        oldPlant.plural ||
                                        oldPlant.singular ||
                                        id
                                    ),

                            icon:
                                food && food.icon
                                    ? food.icon
                                    : (
                                        oldPlant.icon ||
                                        ""
                                    ),

                            prop_folder:
                                food &&
                                food.prop_folder
                                    ? food.prop_folder
                                    : (
                                        oldPlant.prop_folder ||
                                        "tending"
                                    ),

                            type:
                                food &&
                                food.category
                                    ? food.category
                                    : (
                                        oldPlant.type ||
                                        "misc"
                                    ),

                            type_cn:
                                food &&
                                food.category_cn
                                    ? food.category_cn
                                    : (
                                        oldPlant.type_cn ||
                                        oldPlant.type ||
                                        "misc"
                                    ),

                            category:
                                food &&
                                food.category
                                    ? food.category
                                    : oldPlant.category,

                            category_cn:
                                food &&
                                food.category_cn
                                    ? food.category_cn
                                    : oldPlant.category_cn,

                            shop:
                                food && food.shop
                                    ? food.shop
                                    : (
                                        oldPlant.shop ||
                                        {}
                                    )
                        }
                    );

                changed = true;
            }

            if (changed) {
                console.log(
                    "[SG_FoodCompat] " +
                    "setup.SG_OldPlants applied",
                    setup.plants
                );
            }

            return changed;
        },


        patchFoodstuffFromPlants() {
            if (!this.isNewVersion()) return false;

            if (
                !setup.plants ||
                typeof setup.plants !== "object"
            ) {
                return false;
            }

            let changed = false;

            for (const id in setup.plants) {
                const plant =
                    setup.plants[id];

                const food =
                    setup.foodstuff[id];

                /*
                 * setup.plants 有，
                 * 但新版 foodstuff 已不存在的項目
                 * 不進行回填。
                 */
                if (!plant || !food) continue;

                if (
                    !food.tending ||
                    typeof food.tending !== "object"
                ) {
                    food.tending = {};
                    changed = true;
                }

                const tending =
                    food.tending;

                if (
                    tending.growth_days === undefined &&
                    plant.days !== undefined
                ) {
                    tending.growth_days =
                        plant.days;

                    changed = true;
                }

                if (
                    tending.planting_bed === undefined &&
                    plant.bed !== undefined
                ) {
                    tending.planting_bed =
                        plant.bed;

                    changed = true;
                }

                if (
                    tending.yield_multiplier === undefined &&
                    plant.multiplier !== undefined
                ) {
                    tending.yield_multiplier =
                        plant.multiplier;

                    changed = true;
                }

                if (
                    tending.seasons === undefined &&
                    plant.season !== undefined
                ) {
                    tending.seasons =
                        Array.isArray(plant.season)
                            ? plant.season.slice()
                            : [plant.season];

                    changed = true;
                }

                if (
                    tending.tags === undefined &&
                    plant.special !== undefined
                ) {
                    tending.tags =
                        Array.isArray(plant.special)
                            ? plant.special.slice()
                            : [];

                    changed = true;
                }

                if (
                    tending.has_seeds === undefined &&
                    plant.has_seeds !== undefined
                ) {
                    tending.has_seeds =
                        plant.has_seeds;

                    changed = true;
                }
            }

            if (changed) {
                console.log(
                    "[SG_FoodCompat] " +
                    "setup.plants -> setup.foodstuff " +
                    "tending compat patched",
                    setup.foodstuff
                );
            }

            return changed;
        },


        ensureStores() {
            /*
             * 舊版：
             * 使用 $plants。
             *
             * 新版：
             * 使用原版 $foodstuff，
             * 不建立舊版 $plants。
             */
            if (
                !this.isNewVersion() &&
                !State.variables.plants
            ) {
                State.variables.plants = {};
            }

            if (
                !Array.isArray(
                    State.variables.plants_known
                )
            ) {
                State.variables.plants_known = [];
            }
        },


        rebuildPlantsKnown() {
            if (
                !Array.isArray(
                    State.variables.plants_known
                )
            ) {
                State.variables.plants_known = [];
            }

            /*
             * 清理已不存在於 setup.plants 的項目。
             */
            State.variables.plants_known =
                State.variables.plants_known.filter(
                    id => {
                        return (
                            setup.plants &&
                            setup.plants[id]
                        );
                    }
                );
        },


        getPlant(id) {
            return setup.plants?.[id] || null;
        },


        /*
         * 目前官方 icon 全部都在 tending。
         * prop_folder 似乎未實裝，
         * 或另有其他用途。
         */
        usePropFolder: false,


        iconPath(id) {
            const plant =
                this.getPlant(id);

            if (!plant || !plant.icon) {
                return "";
            }

            if (
                String(plant.icon).includes("/")
            ) {
                return plant.icon;
            }

            if (this.usePropFolder) {
                return (
                    "img/misc/icon/" +
                    `${plant.prop_folder || "tending"}/` +
                    plant.icon
                );
            }

            return (
                "img/misc/icon/tending/" +
                plant.icon
            );
        },


        addHarvest(id, amount) {
            if (!id) return;

            amount =
                Number(amount) || 0;

            if (amount <= 0) return;

            this.ensureStores();

            /*
             * 新版：
             * 收成寫入 $foodstuff。
             */
            if (this.isNewVersion()) {
                const store =
                    State.variables.foodstuff;

                if (!store[id]) {
                    store[id] = {
                        amount: 0
                    };
                }

                store[id].amount =
                    Number(
                        store[id].amount
                    ) || 0;

                store[id].amount += amount;

                return;
            }

            /*
             * 舊版：
             * 收成維持寫入 $plants。
             */
            const store =
                State.variables.plants;

            const plant =
                this.getPlant(id);

            if (!store[id]) {
                store[id] = {
                    name:
                        plant?.name || id,

                    plural:
                        plant?.plural || id,

                    amount: 0
                };
            }

            if (
                store[id].name === undefined
            ) {
                store[id].name =
                    plant?.name || id;
            }

            if (
                store[id].plural === undefined
            ) {
                store[id].plural =
                    plant?.plural || id;
            }

            store[id].amount =
                Number(
                    store[id].amount
                ) || 0;

            store[id].amount += amount;
        },


        init() {
            const built =
                this.buildPlantsDbFromFoodstuff();

            const oldPatched =
                this.applyOldPlantsPatch();

            const foodPatched =
                this.patchFoodstuffFromPlants();

            try {
                this.ensureStores();
                this.rebuildPlantsKnown();

                console.log(
                    "[SG_FoodCompat] init done",
                    {
                        newVersion:
                            this.isNewVersion(),

                        built,
                        oldPatched,
                        foodPatched
                    }
                );
            } catch (e) {
                console.warn(
                    "[SG_FoodCompat] init failed:",
                    e
                );

                return false;
            }

            return true;
        }
    };


    /* =========================================================
     * 初始化工具
     * ========================================================= */

    function sleep(ms) {
        return new Promise(
            resolve => setTimeout(resolve, ms)
        );
    }


    /*
     * 從 StartConfig.version 中抽出純數字版本。
     *
     * 例如：
     *
     * "0.5.10.12"
     * → "0.5.10.12"
     *
     * 若版本字串還帶其他文字，
     * 也只取第一段數字版本。
     */
    function getGameVersion() {
        const raw =
            String(
                window.StartConfig?.version || ""
            ).trim();

        if (!raw) return "";

        const match =
            raw.match(/\d+(?:\.\d+)+/);

        return match?.[0] || "";
    }


    /*
     * 比較 dotted numeric version。
     *
     * > 0：a > b
     * = 0：a = b
     * < 0：a < b
     */
    function compareVersion(a, b) {
        const av =
            String(a)
                .split(".")
                .map(Number);

        const bv =
            String(b)
                .split(".")
                .map(Number);

        const length =
            Math.max(
                av.length,
                bv.length
            );

        for (
            let i = 0;
            i < length;
            i++
        ) {
            const x =
                Number.isFinite(av[i])
                    ? av[i]
                    : 0;

            const y =
                Number.isFinite(bv[i])
                    ? bv[i]
                    : 0;

            if (x > y) return 1;
            if (x < y) return -1;
        }

        return 0;
    }


    /*
     * 此遊戲版本是否應使用新版 foodstuff 系統。
     *
     * 這裡判斷的是「遊戲版本能力」，
     * 不依賴 setup.foodstuff 是否已建立。
     */
    function isFoodstuffVersion(version) {
        return (
            compareVersion(
                version,
                FOODSTUFF_VERSION
            ) >= 0
        );
    }


    /*
     * 判斷原版 setup.foodstuff
     * 是否已真正初始化完成。
     *
     * 某些框架可能會提前建立：
     *
     * setup.foodstuff = {};
     *
     * 因此空物件不算 ready。
     */
    function isFoodstuffReady() {
        const foodstuff =
            setup.foodstuff;

        return (
            !!foodstuff &&
            typeof foodstuff === "object" &&
            !Array.isArray(foodstuff) &&
            Object.keys(foodstuff).length > 0
        );
    }


    /*
     * 等待指定條件成立。
     *
     * timeout 後會最後再檢查一次，
     * 避免剛好在邊界完成初始化。
     */
    async function waitUntil(
        check,
        timeout = INIT_TIMEOUT
    ) {
        const start =
            Date.now();

        while (
            Date.now() - start < timeout
        ) {
            try {
                if (check()) {
                    return true;
                }
            } catch (_) {
                /*
                 * 初始化途中物件尚不存在時，
                 * 繼續等待即可。
                 */
            }

            await sleep(
                INIT_CHECK_INTERVAL
            );
        }

        try {
            return !!check();
        } catch (_) {
            return false;
        }
    }


    /* =========================================================
     * Bootstrap
     * ========================================================= */

    async function bootstrapFoodCompat() {

        /*
         * 第一階段：
         * 等待 StartConfig.version。
         *
         * 不直接依 setup.foodstuff 判斷遊戲版本，
         * 避免：
         *
         * - 新版資料尚未初始化
         * - 框架提前建立空 foodstuff
         *
         * 導致新舊版本誤判。
         */
        const versionReady =
            await waitUntil(
                () => !!getGameVersion()
            );

        if (!versionReady) {
            console.warn(
                "[SG_FoodCompat] " +
                "StartConfig.version " +
                "initialization timeout; " +
                "compat initialization aborted."
            );

            return;
        }

        const version =
            getGameVersion();

        /*
         * 舊版：
         *
         * foodstuff 系統不存在，
         * 不需要等待任何新版資料。
         *
         * 直接執行原有 init()，
         * 保持 setup.plants + $plants 流程。
         */
        if (!isFoodstuffVersion(version)) {
            console.log(
                "[SG_FoodCompat] " +
                `legacy game detected (${version}); ` +
                "initializing legacy compat."
            );

            setup.SG_FoodCompat.init();

            return;
        }

        /*
         * 新版：
         *
         * 已由 StartConfig.version 確認
         * setup.foodstuff 理論上一定應該存在。
         *
         * 但框架可能提前建立空 {}，
         * 所以必須等原版 initFoodstuff()
         * 真正填入資料。
         */
        console.log(
            "[SG_FoodCompat] " +
            `foodstuff game detected (${version}); ` +
            "waiting for setup.foodstuff."
        );

        const foodstuffReady =
            await waitUntil(
                isFoodstuffReady
            );

        if (!foodstuffReady) {
            console.warn(
                "[SG_FoodCompat] " +
                `game version ${version} requires foodstuff, ` +
                "but setup.foodstuff was not initialized " +
                `within ${INIT_TIMEOUT / 1000} seconds; ` +
                "compat initialization aborted."
            );

            return;
        }

        /*
         * 到這裡才開始執行真正的新版相容邏輯。
         *
         * 此時可以確定：
         *
         * - 遊戲版本 >= FOODSTUFF_VERSION
         * - setup.foodstuff 存在
         * - setup.foodstuff 是普通 object
         * - setup.foodstuff 不是空物件
         *
         * 因此 build / patch / sync
         * 都能取得完整原版資料。
         */
        console.log(
            "[SG_FoodCompat] " +
            "setup.foodstuff ready; " +
            "initializing compat."
        );

        setup.SG_FoodCompat.init();
    }


    /*
     * 非阻塞啟動。
     *
     * 不 await bootstrapFoodCompat()，
     * 避免阻塞目前模組載入流程。
     */
    void bootstrapFoodCompat().catch(
        e => {
            console.error(
                "[SG_FoodCompat] " +
                "bootstrap failed:",
                e
            );
        }
    );

})();