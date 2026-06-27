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
 * ============================== */

(function () {
    "use strict";

    setup.SG_FoodCompat = {
        
        // 判斷當前環境是否為遊戲版本0.5.10.12或以上
        isNewVersion() {
            return !!setup.foodstuff && typeof setup.foodstuff === "object";
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
             * 例如 bird_egg 只有 affected_by_tending_skill / tags，
             * 不應自動變成 earth / 5 天。
             */
            if (!this.isCompleteTending(tending)) {
                return null;
            }

            return {
                index: item.index ?? 0,
                name: item.name || id,
                singular: item.singular || item.name || id,
                plural: item.plural || item.singular || item.name || id,

                icon: item.icon || "",
                prop_folder: item.prop_folder || "tending",

                type: item.category || "misc",
                type_cn: item.category_cn || item.category || "misc",
                category: item.category,
                category_cn: item.category_cn,

                bed: tending.planting_bed,
                days: Number(tending.growth_days) || 5,
                multiplier: Number(tending.yield_multiplier ?? 1),

                season: tending.seasons.slice(),

                special: Array.isArray(tending.tags)
                    ? tending.tags.slice()
                    : [],

                has_seeds: tending.has_seeds !== false,
                shop: item.shop || {}
            };
        },

        buildPlantsDbFromFoodstuff() {
            if (!this.isNewVersion()) return false;

            if (!setup.plants || typeof setup.plants !== "object") {
                setup.plants = {};
            }

            let changed = false;

            for (const id in setup.foodstuff) {
                const converted = this.convertOne(id, setup.foodstuff[id]);
                if (!converted) continue;

                if (!setup.plants[id]) {
                    setup.plants[id] = converted;
                    changed = true;
                    continue;
                }

                const plant = setup.plants[id];

                if (plant.bed === undefined) plant.bed = converted.bed;
                if (plant.days === undefined) plant.days = converted.days;
                if (plant.multiplier === undefined) plant.multiplier = converted.multiplier;
                if (plant.season === undefined) plant.season = converted.season;
                if (plant.special === undefined) plant.special = converted.special;
                if (plant.icon === undefined) plant.icon = converted.icon;
                if (plant.prop_folder === undefined) plant.prop_folder = converted.prop_folder;
                if (plant.name === undefined) plant.name = converted.name;
                if (plant.singular === undefined) plant.singular = converted.singular;
                if (plant.plural === undefined) plant.plural = converted.plural;
                if (plant.type === undefined) plant.type = converted.type;
                if (plant.type_cn === undefined) plant.type_cn = converted.type_cn;
                if (plant.category === undefined) plant.category = converted.category;
                if (plant.category_cn === undefined) plant.category_cn = converted.category_cn;

                changed = true;
            }

            if (changed) {
                console.log("[SG_FoodCompat] setup.foodstuff -> setup.plants compat patched", setup.plants);
            }

            return changed;
        },

        applyOldPlantsPatch() {
            if (!this.isNewVersion()) return false;

            const patch = setup.SG_OldPlants || {};
            if (!patch || typeof patch !== "object") return false;

            if (!setup.plants || typeof setup.plants !== "object") {
                setup.plants = {};
            }

            let changed = false;

            for (const id in patch) {
                const oldPlant = patch[id];
                if (!oldPlant) continue;

                const food = setup.foodstuff && setup.foodstuff[id];

                /*
                 * 舊版種植邏輯為主：
                 * - bed / days / multiplier / season / special 使用 setup.SG_OldPlants
                 *
                 * 新版 foodstuff 為顯示資料來源：
                 * - name / singular / plural / icon / prop_folder / category 使用新版
                 */
                setup.plants[id] = Object.assign({}, oldPlant, {
                    index: food && food.index !== undefined ? food.index : oldPlant.index,

                    name: food && food.name ? food.name : (oldPlant.name || id),
                    singular: food && food.singular ? food.singular : (oldPlant.singular || oldPlant.name || id),
                    plural: food && food.plural ? food.plural : (oldPlant.plural || oldPlant.singular || id),

                    icon: food && food.icon ? food.icon : (oldPlant.icon || ""),
                    prop_folder: food && food.prop_folder ? food.prop_folder : (oldPlant.prop_folder || "tending"),

                    type: food && food.category ? food.category : (oldPlant.type || "misc"),
                    type_cn: food && food.category_cn ? food.category_cn : (oldPlant.type_cn || oldPlant.type || "misc"),
                    category: food && food.category ? food.category : oldPlant.category,
                    category_cn: food && food.category_cn ? food.category_cn : oldPlant.category_cn,

                    shop: food && food.shop ? food.shop : (oldPlant.shop || {})
                });

                changed = true;
            }

            if (changed) {
                console.log("[SG_FoodCompat] setup.SG_OldPlants applied", setup.plants);
            }

            return changed;
        },

        ensureStores() {
            if (!State.variables.plants) {
                State.variables.plants = {};
            }

            if (!Array.isArray(State.variables.plants_known)) {
                State.variables.plants_known = [];
            }

            if (this.isNewVersion() && State.variables.foodstuff === undefined) {
                State.variables.foodstuff = {};
            }
        },

        rebuildPlantsKnown() {
            
            if (!this.isNewVersion()) return;
            
            if (!Array.isArray(State.variables.plants_known)) {
                State.variables.plants_known = [];
            }

            /*
             * 新版：
             * 重新整理 plants_known，只保留 setup.plants 裡真的存在的項目。
             * 避免舊存檔或舊初始化殘留不存在的 id。
             */
            if (this.isNewVersion()) {
                State.variables.plants_known = [];

                for (const id in setup.plants) {
                    const plant = setup.plants[id];
                    if (!plant) continue;

                    if (!State.variables.plants_known.includes(id)) {
                        State.variables.plants_known.push(id);
                    }
                }

                return;
            }

            /*
             * 舊版：
             * 不重建，只過濾掉不存在的 id。
             */
            State.variables.plants_known = State.variables.plants_known.filter(id => {
                return setup.plants && setup.plants[id];
            });
        },

        getPlant(id) {
            return setup.plants?.[id] || null;
        },
        
        // 目前官方icon全部都在 tending，prop_folder似乎未實裝或是有其他用途
        usePropFolder: false,

        iconPath(id) {
            const plant = this.getPlant(id);
            if (!plant || !plant.icon) return "";

            if (String(plant.icon).includes("/")) {
                return plant.icon;
            }

            if (this.usePropFolder) {
                return `img/misc/icon/${plant.prop_folder || "tending"}/${plant.icon}`;
            }
           
            return `img/misc/icon/tending/${plant.icon}`;
        },

        addHarvest(id, amount) {
            if (!id) return;

            amount = Number(amount) || 0;
            if (amount <= 0) return;

            this.ensureStores();

            if (this.isNewVersion()) {
                const store = State.variables.foodstuff;

                if (!store[id]) {
                    store[id] = { amount: 0 };
                }

                store[id].amount = Number(store[id].amount) || 0;
                store[id].amount += amount;
                return;
            }

            const store = State.variables.plants;
            const plant = this.getPlant(id);

            if (!store[id]) {
                store[id] = {
                    name: plant?.name || id,
                    plural: plant?.plural || id,
                    amount: 0
                };
            }

            if (store[id].name === undefined) {
                store[id].name = plant?.name || id;
            }

            if (store[id].plural === undefined) {
                store[id].plural = plant?.plural || id;
            }

            store[id].amount = Number(store[id].amount) || 0;
            store[id].amount += amount;
        },

        clearTempPlant(id) {
            if (!this.isNewVersion()) return;
            if (!id) return;
            if (!State.variables.plants) return;

            delete State.variables.plants[id];
        },

        init() {
            this.buildPlantsDbFromFoodstuff();
            this.applyOldPlantsPatch();

            try {
                this.ensureStores();
                this.rebuildPlantsKnown();
                console.log("[SG_FoodCompat] init done");
            } catch (e) {
                console.warn("[SG_FoodCompat] init skipped:", e);
            }
        }
    };

    setup.SG_FoodCompat.init();

})();