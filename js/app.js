// Copyright (c) 2022 @shi_chikuzen

Vue.use(Vuetify);

const vuetify = new Vuetify({
    theme: {
        themes: {
            light: {
                primary: '#00aeb9',
                success: '#00aeb9',
            },
        },
    },
});

var app = new Vue({
    el: '#app',
    vuetify: new Vuetify(),
    data: {
        fileSelected: null,
        workbook: null,
        state: { "fileError": false, "ready": false, "loading": false, "message": [], "errorSnack": false },
        default: {
            "color": ["#47cacc", "#63bcc9", "#cdb3d4", "#e7b7c8", "#ffbe88"],
            "gradient": [
                "linear-gradient(127deg, #47cacc, #cdb3d4)",
                "linear-gradient(127deg, #63bcc9, #47cacc)",
                "linear-gradient(127deg, #cdb3d4, #ffbe88)",
                "linear-gradient(127deg, #e7b7c8, #cdb3d4)",
                "linear-gradient(127deg, #ffbe88, #e7b7c8)",
            ],
            "sheetNames": { "category": "カテゴリー", "character": "キャラクター", "school": "教育課程", "event": "イベント" },
            "colNames": {
                "category": { "name": "カテゴリ名", "color": "カテゴリ色", "bgcolor": "カテゴリ色" },
                "character": { "name": "キャラクタ名", "category": "カテゴリ", "birthday": "誕生日（yyyy/MM/dd）", "autoBirth": "誕生年自動計算", "schoolName": "教育課程名", "schoolPeriod": "教育課程年数" },
                "school": { "name": "名称", "period": "年数", "month": "開始月", "age": "開始年齢" },
                "event": { "category": "カテゴリ", "title": "タイトル", "year": "年", "month": "月", "day": "日", "hour": "月", "minute": "分", "detail": "詳細" },
            },
        },
        data: { "settings": { "category": {}, "character": {}, "school": {}, }, "event": [] },
    },
    mounted: function () { },
    watch: {
        workbook: 'init'
    },
    methods: {
        getObjectKey(obj, val) { // dictをvalで逆引きする
            const key = Object.keys(obj).filter(key => {
                return obj[key] === val;
            })
            return key;
        },
        convertSerial2Date(serial) { // エクセルのシリアル値をDateに変換する
            const coef = 24 * 60 * 60 * 1000;
            const offset = 70 * 365 + 17 + 1 + 1;
            const diff = 9 * 60 * 60 * 1000;
            const unixtime = (serial - offset) * coef - diff;
            return new Date(unixtime);
        },
        readFile: function (file) { // xlsx読み込み
            this.state.loading = true;
            const vm = this;
            const reader = new FileReader();
            reader.onload = function (e) {
                let data = e.target.result;
                vm.workbook = XLSX.read(data, { 'type': 'binary' })
            };
            reader.readAsBinaryString(file);
        },
        validData() { // 必要なシート・列がファイルに存在するかを返す
            this.state.message = [];
            const sheetNames = Object.values(this.default.sheetNames);
            let valid = true;
            for (let i = 0; i < sheetNames.length; i++) {
                if (this.workbook.SheetNames.indexOf(sheetNames[i]) == -1) {
                    this.state.message.push(`以下のシートが存在しません: ${sheetNames[i]}`);
                    valid = false;
                } else {
                    const data = XLSX.utils.sheet_to_json(this.workbook.Sheets[sheetNames[i]], { header: 1 });
                    const key = this.getObjectKey(this.default.sheetNames, sheetNames[i]);
                    const colNames = Object.values(this.default.colNames[key]);
                    for (let j = 0; j < colNames.length; j++) {
                        if (data[0].indexOf(colNames[j]) == -1) {
                            this.state.message.push(`${sheetNames[i]}シートに以下の列が存在しません: ${colNames[j]}`);
                            valid = false;
                        };
                    };
                };
            };
            this.state.fileError = !valid;
            return valid;
        },
        getBirth(data) { // 誕生年を計算してDate形式で返す
            return "true";
        },
        createCategory() { // カテゴリ設定を読み込んでフォーマット
            const data = XLSX.utils.sheet_to_json(this.workbook.Sheets[this.default.sheetNames["category"]], { header: 0 });
            const colNames = this.default.colNames["category"];
            for (let i = 0; i < data.length; i++) { // 各データを処理
                let row = {
                    "color": (colNames["color"] in data[i]) ? data[i]["カテゴリ色"] : this.default.color[i % this.default.color.length],
                    "bgcolor": (colNames["color"] in data[i]) ? data[i]["カテゴリ色"] : this.default.gradient[i % this.default.color.length],
                    "characters": [],
                };
                this.data.settings.category[data[i][colNames["name"]]] = row;
            };
        },
        createSchool() { // 教育課程設定を読み込んでフォーマット
            const data = XLSX.utils.sheet_to_json(this.workbook.Sheets[this.default.sheetNames["school"]], { header: 0 });
            const colNames = this.default.colNames["school"];
            for (let i = 0; i < data.length; i++) { // 各データを処理
                let row = {
                    "period": Number(data[i][colNames["period"]]),
                    "month": Number(data[i][colNames["month"]]),
                    "age": Number(data[i][colNames["age"]]),
                };
                this.data.settings.school[data[i][colNames["name"]]] = row;
            };
        },
        createCharacter() {
            const data = XLSX.utils.sheet_to_json(this.workbook.Sheets[this.default.sheetNames["character"]], { header: 0 });
            const colNames = this.default.colNames["character"];
            for (let i = 0; i < data.length; i++) { // 各データを処理
                const row = data[i];
                if (!(row[colNames["category"]] in this.data.settings.category)) { // 指定カテゴリが存在しない
                    this.state.message.push(`キャラクター「${row[colNames["name"]]}」に指定されたカテゴリ「${row[colNames["category"]]}」の設定が存在しません`);
                    continue;
                };
                let result = {
                    "category": row[colNames["category"]],
                    "birthday": !(row[colNames["autoBirth"]]) ? this.convertSerial2Date(row[colNames["birthday"]]) : this.getBirth(row),
                };
                this.data.settings.character[row[colNames["name"]]] = result;
            };
        },
        async formatData() { // 読み込んだxlsxをフォーマット
            this.state.message = [];
            if (this.validData()) {
                await this.createCategory();
                await this.createSchool();
                await this.createCharacter();
                console.info(this.data);
            };
            if (this.state.message.length != 0) {
                this.state.errorSnack = true;
            };
        },
        async init() { // 初期化処理
            this.state.ready = false;
            await this.formatData();
            this.state.loading = false;
            this.state.ready = true;
        }
    },
});
