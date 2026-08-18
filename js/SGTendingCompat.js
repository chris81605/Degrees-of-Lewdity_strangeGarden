(function () {
    "use strict";

    function fixShortGrowth() {
        const plots = State.variables.plots?.strangeGarden;

        if (!Array.isArray(plots)) return;

        for (const plot of plots) {
            if (!plot) continue;

            // 沒種植或已成熟
            if (plot.stage < 1 || plot.stage >= 5) continue;

            const growthDays = Number(
                setup.foodstuff?.[plot.plant]?.tending?.growth_days
                ?? setup.plants?.[plot.plant]?.days
            );

            if (!Number.isFinite(growthDays) || growthDays < 1) continue;

            /*
             * 原版成長系統每天最多只能提升一個 stage，
             * 因此 growth_days 低於 4 的物品無法按照設定天數成熟。
             *
             * plot.days 仍由原版 tendingDay() 負責累積，
             * 此處只針對 StrangeGarden 的短週期物品修正成熟階段。
             */
            if (
                growthDays < 4 &&
                plot.days >= growthDays
            ) {
                plot.stage = 5;
            }
        }
    }

    /*
     * 不直接修改原版 tendingDay()。
     * 每次 passage 處理完成後檢查一次即可，
     * 原版換日時若已增加 plot.days，這裡就會立即修正短週期物品。
     */
    $(document).on(":passageend.SGTendingCompat", function () {
        fixShortGrowth();
    });

    setup.SG_fixShortGrowth = fixShortGrowth;

    console.log("[SGTendingCompat] short growth fix registered");
})();