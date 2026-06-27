/* ==============================
 * SG Foodstuff Debug Helpers
 *
 * 用途：
 * 1. SG_DebugMissingPlants()
 *    找出 setup.foodstuff 有，但目前 setup.plants 沒有的資料。
 *
 * 2. SG_DebugNewMissingPlants()
 *    找出 setup.foodstuff 有、setup.SG_OldPlants 沒有，
 *    而且目前 setup.plants 也沒有的資料。
 *
 * 3. SG_DebugOldPatchNotApplied()
 *    找出 setup.SG_OldPlants 有，但沒有成功補進 setup.plants 的資料。
 *
 * 判斷原則：
 * - 在目前架構下，setup.SG_OldPlants 理論上會全部補進 setup.plants。
 * - 所以 SG_DebugMissingPlants() 和 SG_DebugNewMissingPlants()
 *   理論上應該輸出一致。
 * - 如果兩者不一致，通常代表舊版補丁沒有完全套用。
 * ============================== */

(function () {
    "use strict";

    setup.SG_DebugMissingPlants = function () {
        const food = setup.foodstuff || {};
        const old = setup.SG_OldPlants || {};
        const plants = setup.plants || {};

        const result = Object.keys(food)
            .filter(id => !plants[id])
            .map(id => {
                const item = food[id] || {};
                const tending = item.tending;

                return {
                    id,
                    name: item.name,
                    plural: item.plural,
                    category: item.category,
                    category_cn: item.category_cn,
                    icon: item.icon,
                    prop_folder: item.prop_folder,
                    has_tending: !!tending,
                    has_complete_tending: !!(
                        tending &&
                        tending.planting_bed !== undefined &&
                        tending.growth_days !== undefined &&
                        tending.yield_multiplier !== undefined &&
                        Array.isArray(tending.seasons)
                    ),
                    in_old_patch: !!old[id],
                    reason: old[id]
                        ? "SG_OldPlants 有，但 setup.plants 沒有，代表補丁未成功套用"
                        : "新版 foodstuff 有，但舊版補丁與 setup.plants 都沒有"
                };
            });

        console.group("[SG Debug] foodstuff 有，但目前 setup.plants 沒有");
        console.log("用途：檢查相容層是否漏轉，或 SG_OldPlants 是否漏補。");
        console.log("理論：若 SG_OldPlants 已全部套用，這份清單應與 SG_DebugNewMissingPlants() 一致。");
        console.log("數量：", result.length);
        console.table(result);
        console.groupEnd();

        return result;
    };

    setup.SG_DebugNewMissingPlants = function () {
        const food = setup.foodstuff || {};
        const old = setup.SG_OldPlants || {};
        const plants = setup.plants || {};

        const result = Object.keys(food)
            .filter(id => !old[id])
            .filter(id => !plants[id])
            .map(id => {
                const item = food[id] || {};
                const tending = item.tending;

                return {
                    id,
                    name: item.name,
                    plural: item.plural,
                    category: item.category,
                    category_cn: item.category_cn,
                    icon: item.icon,
                    prop_folder: item.prop_folder,
                    has_tending: !!tending,
                    has_complete_tending: !!(
                        tending &&
                        tending.planting_bed !== undefined &&
                        tending.growth_days !== undefined &&
                        tending.yield_multiplier !== undefined &&
                        Array.isArray(tending.seasons)
                    ),
                    reason: "新版 foodstuff 新增，SG_OldPlants 尚未補資料，setup.plants 也沒有"
                };
            });

        console.group("[SG Debug] 新版新增且目前無法種植");
        console.log("用途：找出官方新版新增，但尚未加入 SG_OldPlants 的項目。");
        console.log("理論：若 SG_OldPlants 已全部套用，這份清單應與 SG_DebugMissingPlants() 一致。");
        console.log("數量：", result.length);
        console.table(result);
        console.groupEnd();

        return result;
    };

    setup.SG_DebugOldPatchNotApplied = function () {
        const old = setup.SG_OldPlants || {};
        const plants = setup.plants || {};

        const result = Object.keys(old)
            .filter(id => !plants[id])
            .map(id => ({
                id,
                name: old[id].name,
                plural: old[id].plural,
                type: old[id].type,
                type_cn: old[id].type_cn,
                bed: old[id].bed,
                icon: old[id].icon,
                reason: "存在於 SG_OldPlants，但沒有補進 setup.plants"
            }));

        console.group("[SG Debug] SG_OldPlants 未成功套用");
        console.log("用途：檢查 applyOldPlantsPatch() 或載入順序是否有問題。");
        console.log("理論：這份清單正常應該是空陣列。");
        console.log("數量：", result.length);
        console.table(result);
        console.groupEnd();

        return result;
    };

    setup.SG_DebugCompareMissingLists = function () {
        const missing = setup.SG_DebugMissingPlants();
        const newMissing = setup.SG_DebugNewMissingPlants();
        const patchFailed = setup.SG_DebugOldPatchNotApplied();

        const missingIds = missing.map(item => item.id).sort();
        const newMissingIds = newMissing.map(item => item.id).sort();

        const same =
            missingIds.length === newMissingIds.length &&
            missingIds.every((id, index) => id === newMissingIds[index]);

        console.group("[SG Debug] 缺失清單一致性檢查");
        console.log("SG_DebugMissingPlants 與 SG_DebugNewMissingPlants 是否一致：", same);
        console.log("SG_OldPlants 未成功套用數量：", patchFailed.length);

        if (!same) {
            console.warn("兩份清單不一致，通常代表 SG_OldPlants 有項目沒有成功補進 setup.plants。");
        }

        if (patchFailed.length > 0) {
            console.warn("SG_OldPlants 有資料未套用，請檢查載入順序或 setup.SG_FoodCompat.init() 是否有執行。");
        }

        console.groupEnd();

        return {
            same,
            missing,
            newMissing,
            patchFailed
        };
    };

})();

/* ==============================
 * SG Custom Plants Generator
 *
 * 用途：
 * - 找出新版 foodstuff 有
 * - 但 SG_OldPlants / SG_CustomPlants / setup.plants 都沒有的項目
 * - 產生可直接貼到 plants-custom.js 的資料
 * ============================== */

(function () {
    "use strict";

    setup.SG_GenerateCustomPlants = function () {
        const food = setup.foodstuff || {};
        const old = setup.SG_OldPlants || {};
        const custom = setup.SG_CustomPlants || {};
        const plants = setup.plants || {};

        const ids = Object.keys(food)
            .filter(id => !old[id])
            .filter(id => !custom[id])
            .filter(id => !plants[id])
            .sort((a, b) => {
                const ai = food[a]?.index ?? 999999;
                const bi = food[b]?.index ?? 999999;
                return ai - bi;
            });

        const lines = [];

        lines.push("setup.SG_CustomPlants = {");
        lines.push("");

        ids.forEach(id => {
            const item = food[id] || {};
            const tending = item.tending || {};
            const foodTags = item.food?.tags || [];
            const tendingTags = tending.tags || [];

            const hasCompleteTending =
                tending.planting_bed !== undefined &&
                tending.growth_days !== undefined &&
                tending.yield_multiplier !== undefined &&
                Array.isArray(tending.seasons);

            if (!hasCompleteTending) {
                lines.push(`\t// TODO: ${id} 無完整 tending，請手動確認 bed / days / multiplier / season`);
            }

            lines.push(`\t${id}: {`);
            lines.push(`\t\tindex: ${item.index ?? 0},`);
            lines.push(`\t\tname: ${JSON.stringify(id)},`);
            lines.push(`\t\tsingular: ${JSON.stringify(item.singular || item.name || id)},`);
            lines.push(`\t\tplural: ${JSON.stringify(item.plural || item.singular || item.name || id)},`);
            lines.push(`\t\tplant_cost: ${item.shop?.sell_price ?? 0},`);
            lines.push(`\t\tdifficulty: 1,`);
            lines.push(`\t\tbed: ${JSON.stringify(hasCompleteTending ? tending.planting_bed : "earth")},`);
            lines.push(`\t\ttype: ${JSON.stringify(item.category || "misc")},`);
            lines.push(`\t\ttype_cn: ${JSON.stringify(item.category_cn || item.category || "misc")},`);
            lines.push(`\t\tdays: ${hasCompleteTending ? Number(tending.growth_days) || 5 : 5},`);
            lines.push(`\t\tmultiplier: ${hasCompleteTending ? Number(tending.yield_multiplier ?? 1) : 1},`);
            lines.push(`\t\tspecial: ${JSON.stringify([].concat(tendingTags, foodTags))},`);
            lines.push(`\t\tseason: ${JSON.stringify(hasCompleteTending ? tending.seasons : ["spring", "summer", "autumn", "winter"])},`);
            lines.push(`\t\tingredients: ${JSON.stringify(item.recipe?.ingredients || [])},`);

            if (item.recipe?.recipe_name) {
                lines.push(`\t\trecipe_name: ${JSON.stringify(item.recipe.recipe_name)},`);
            }

            if (item.food?.handheld_gift) {
                lines.push(`\t\thandheld_gift: true,`);
            }

            lines.push(`\t\ticon: ${JSON.stringify(item.icon || "")},`);
            lines.push(`\t},`);
            lines.push("");
        });

        lines.push("};");

        const output = lines.join("\n");

        console.group("[SG Generator] plants-custom.js 可貼上資料");
        console.log("用途：把以下內容複製到 plants-custom.js。");
        console.log("數量：", ids.length);
        console.log(output);
        console.groupEnd();

        return output;
    };

})();