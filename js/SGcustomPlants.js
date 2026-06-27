/* ==========================
 * Strange Garden 自訂植物資料
 *
 * 用途：
 * - 補齊新版新增物品的種植參數。
 * - 當官方新增 foodstuff，但相容層無法自動轉換時，
 *   可將資料新增於此。
 *
 * 建議流程：
 * 1. 執行 setup.SG_GenerateCustomPlants()
 * 2. 找出新版新增且尚未支援種植的物品。
 * 3. 將輸出的資料貼到此檔。
 * 4. 手動修正 bed、days、season、difficulty、
 *    plant_cost 等需要調整的欄位。
 * ========================== */

setup.SG_CustomPlants = {

	// TODO: souffle 無完整 tending，請手動確認 bed / days / multiplier / season
	souffle: {
		index: 95,
		name: "souffle",
		singular: "soufflé",
		plural: "舒芙蕾",
		plant_cost: 3000,
		difficulty: 1,
		bed: "kitchen",
		type: "dish",
		type_cn: "菜肴",
		days: 5,
		multiplier: 1,
		special: ["vegetarian","sweet"],
		season: ["spring","summer","autumn","winter"],
		ingredients: ["chicken_egg","cream","sugar","butter","flour","lemon"],
		recipe_name: "soufflés",
		icon: "souffle.png",
	},

	// TODO: creme_brulee 無完整 tending，請手動確認 bed / days / multiplier / season
	creme_brulee: {
		index: 103,
		name: "creme_brulee",
		singular: "pot of crème brûlée",
		plural: "烤布蕾",
		plant_cost: 600,
		difficulty: 1,
		bed: "kitchen",
		type: "dish",
		type_cn: "菜肴",
		days: 5,
		multiplier: 1,
		special: ["vegetarian","sweet"],
		season: ["spring","summer","autumn","winter"],
		ingredients: ["bottle_of_milk","cream","sugar","chicken_egg"],
		recipe_name: "crème brûlée",
		icon: "creme-brulee.png",
	},

};