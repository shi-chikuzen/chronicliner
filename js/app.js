// Copyright (c) 2022 @shi_chikuzen

var app = new Vue({
    el: '#app',
    vuetify: new Vuetify(),
    data: {
        fileSelected: null,
        workbook: null,
        state: { "fileError": false, "ready": false, "loading": false },
        default: {
            "color": ["#47cacc", "#63bcc9", "#cdb3d4", "#e7b7c8", "#ffbe88"],
            "gradient": [
                "linear-gradient(127deg, #47cacc, #cdb3d4)",
                "linear-gradient(127deg, #63bcc9, #47cacc)",
                "linear-gradient(127deg, #cdb3d4, #ffbe88)",
                "linear-gradient(127deg, #e7b7c8, #cdb3d4)",
                "linear-gradient(127deg, #ffbe88, #e7b7c8)",
            ],
        },
        data: { "settings": {"category": {}, "character": {}, "school": {},}, "event": []},
    },
    mounted: function () { },
    watch: {
        workbook: 'init'
    },
    methods: {
        readFile: function (file) { // xlsx読み込み
            this.state.loading = true;
            const vm = this;
            const reader = new FileReader();
            reader.onload = function (e) {
                let data = e.target.result;
                vm.workbook = XLSX.read(data, {'type': 'binary'})
            };
            reader.readAsBinaryString(file);
        },
        validData() { // 指定シートがファイルに存在するかを返す
            const sheetNames = ["カテゴリー", "キャラクター", "教育課程", "イベント"]
            let valid = true;
            for (let i = 0; i < sheetNames.length; i++){
                if (this.workbook.SheetNames.indexOf(sheetNames[i]) == -1) {
                    valid = false;
                };
            };
            this.state.fileError = !valid;
            return valid;
        },
        createCategory() { // カテゴリ設定を読み込んでフォーマット
            const data = XLSX.utils.sheet_to_json(this.workbook.Sheets["カテゴリー"], { header: 0 });
            for (let i = 0; i < data.length; i++) { // 各データを処理
                let row = {
                    "color": ("カテゴリ色" in data[i]) ? data[i]["カテゴリ色"] : this.default.color[i % this.default.color.length],
                    "bgcolor": ("カテゴリ色" in data[i]) ? data[i]["カテゴリ色"] : this.default.gradient[i % this.default.color.length],
                };
                this.data.settings.category[data[i]["カテゴリ名"]] = row;
            };
        },
        createSchool() { // 教育課程設定を読み込んでフォーマット
            const data = XLSX.utils.sheet_to_json(this.workbook.Sheets["教育課程"], { header: 0 });
            for (let i = 0; i < data.length; i++) { // 各データを処理
                let row = {
                    "period": Number(data[i]["年数"]),
                    "month": Number(data[i]["開始月"]),
                    "age": Number(data[i]["開始年齢"]),
                };
                this.data.settings.school[data[i]["名称"]] = row;
            };
        },
        formatData() { // 読み込んだxlsxをフォーマット
            if (this.validData()) {
                this.createCategory();
                this.createSchool();
                console.info(this.data);
            }
        },
        async init() { // 初期化処理
            this.state.ready = false;
            await this.formatData();
            this.state.loading = false;
            this.state.ready = true;
        }
    },
})