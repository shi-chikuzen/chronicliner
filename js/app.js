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
        defaults: {
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
                "character": { "name": "キャラクタ名", "category": "カテゴリ", "birthday": "誕生日", "schoolName": "教育課程名", "schoolOffset": "開始年齢調整", "autoBirth": "誕生年自動計算", "autoYear": "起算年", "autoSchool": "起算課程", "autoGrade": "起算学年" },
                "school": { "name": "名称", "period": "年数", "month": "開始月", "age": "開始年齢" },
                "event": { "category": "カテゴリ", "title": "タイトル", "date": "日時", "limit": "以降を無視", "detail": "詳細" },
            },
            "displayLimit": {"month": 0, "day": 1, "hour": 2, "minute": 3},
        },
        data: { "settings": { "category": {}, "character": {}, "school": {}, }, "event": {} },
        characterSelected: [],
        eventKeys: [],
    },
    computed: {
        snackMessage: function () {
            return this.state.message.join("<br>");
        },
    },
    mounted: function () {
        this.defaults.data = JSON.parse(JSON.stringify(this.data));
    },
    watch: {
        workbook: 'init',
        characterSelected: 'update',
    },
    methods: {
        getObjectKey(obj, val) { // dictをvalで逆引きする
            const key = Object.keys(obj).filter(key => {
                return obj[key] === val;
            })
            return key;
        },
        zip(array1, array2) { // Python zip
            let result = [...Array(array1.length)];
            result.forEach(function (elem, index) {
                result[index] = [array1[index], array2[index]];
            });
            return result;
        },
        union(array1, array2) { // 配列の和集合を返す
            const x = new Set(array1);
            const y = new Set(array2);
            return Array.from(new Set([...x, ...y]));
        },
        intersection(array1, array2) { // 配列の積集合を返す
            const x = new Set(array1);
            const y = new Set(array2);
            return Array.from(new Set([...x].filter(e => (y.has(e)))));
        },
        convertSerial2Date(serial) { // エクセルのシリアル値をDateに変換する
            const coef = 24 * 60 * 60 * 1000;
            const offset = 70 * 365 + 17 + 1 + 1;
            const diff = 9 * 60 * 60 * 1000;
            const unixtime = (serial - offset) * coef - diff;
            let result = new Date(unixtime);
            if (result.getSeconds() > 0) {
                result.setSeconds(result.getSeconds() + 1);
                result.setMilliseconds(0);
            };
            return result;
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
            const sheetNames = Object.values(this.defaults.sheetNames);
            let valid = true;
            for (let i = 0; i < sheetNames.length; i++) {
                if (this.workbook.SheetNames.indexOf(sheetNames[i]) == -1) {
                    this.state.message.push(`以下のシートが存在しません: ${sheetNames[i]}`);
                    valid = false;
                } else {
                    const data = XLSX.utils.sheet_to_json(this.workbook.Sheets[sheetNames[i]], { header: 1 });
                    const key = this.getObjectKey(this.defaults.sheetNames, sheetNames[i]);
                    const colNames = Object.values(this.defaults.colNames[key]);
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
        isBetween(target, start, end) { // targetがstart以上end未満かを返す
            return (target >= start) && (target < end);
        },
        getBirth(data) { // 誕生年を計算してDate形式で返す
            const colNames = this.defaults.colNames["character"];
            let birthday = this.convertSerial2Date(data[colNames["birthday"]]);
            const schoolName = data[colNames["schoolName"]]
            const autoYear = data[colNames["autoYear"]];
            const autoSchool = data[colNames["autoSchool"]];
            const autoGrade = data[colNames["autoGrade"]];
            if (!(autoSchool in this.data.settings.school)) { // 指定された学校が存在しない
                this.state.message.push(`キャラクター「${data[colNames["name"]]}」に指定された起算課程「${autoSchool}」の設定が存在しません`);
            } else if (schoolName.split("_").indexOf(autoSchool) == -1) { // 指定された学校に在籍する設定になっていない
                this.state.message.push(`キャラクター「${row[colNames["name"]]}」に指定された起算課程「${autoSchool}」は該当キャラクターの教育課程に設定されていません`);
            } else { // 学校設定に合わせて誕生日を計算
                const schoolData = this.data.settings.school[autoSchool];
                const month = schoolData["month"];
                const age = schoolData["age"];
                const period = schoolData["period"];
                if (autoGrade > period) {
                    this.state.message.push(`キャラクター「${row[colNames["name"]]}」に指定された起算年数が、起算課程「${autoSchool}」の期間設定を超過しています`)
                } else {
                    // 指定教育課程の1年目の期間を設定
                    const startDate = new Date(autoYear - autoGrade + 1, month - 1, 1);
                    const endDate = new Date(autoYear - autoGrade + 2, month - 1, 1);
                    // birthdayを指定教育課程1年目の期間内になるように設定
                    birthday.setFullYear(startDate.getFullYear());
                    if (!this.isBetween(birthday, startDate, endDate)) {
                        birthday.setFullYear(birthday.getFullYear() + 1);
                    };
                    // 指定教育課程の開始年齢を減算
                    birthday.setFullYear(birthday.getFullYear() - age);
                };
            };
            return birthday;
        },
        getCharacterSchoolInfo(name, date) { // 指定キャラクターの該当Dateの教育課程情報を返す
            const character = this.data.settings.character[name];
            const schools = character.school.details;
            for (let index = 0; index < schools.length; index++) {
                const school = schools[index];
                if (this.isBetween(date, school.start, school.end)) {
                    const grade = Math.floor((date.getTime() - school.start.getTime()) / (365*24*60*60*1000)) + 1;
                    return {"name": school.name, "grade": grade};
                };
            };
            return {};
        },
        createCategory() { // カテゴリ設定を読み込んでフォーマット
            const data = XLSX.utils.sheet_to_json(this.workbook.Sheets[this.defaults.sheetNames["category"]], { header: 0 });
            const colNames = this.defaults.colNames["category"];
            for (let i = 0; i < data.length; i++) { // 各データを処理
                let row = {
                    "color": (colNames["color"] in data[i]) ? String(data[i]["カテゴリ色"]) : this.defaults.color[i % this.defaults.color.length],
                    "bgcolor": (colNames["color"] in data[i]) ? String(data[i]["カテゴリ色"]) : this.defaults.gradient[i % this.defaults.color.length],
                    "characters": [],
                };
                this.data.settings.category[String(data[i][colNames["name"]])] = row;
            };
        },
        createSchool() { // 教育課程設定を読み込んでフォーマット
            const data = XLSX.utils.sheet_to_json(this.workbook.Sheets[this.defaults.sheetNames["school"]], { header: 0 });
            const colNames = this.defaults.colNames["school"];
            for (let i = 0; i < data.length; i++) { // 各データを処理
                let row = {
                    "period": Number(data[i][colNames["period"]]),
                    "month": Number(data[i][colNames["month"]]),
                    "age": Number(data[i][colNames["age"]]),
                };
                this.data.settings.school[String(data[i][colNames["name"]])] = row;
            };
        },
        createCharacter() { // キャラクタ設定を読み込んでフォーマット
            const data = XLSX.utils.sheet_to_json(this.workbook.Sheets[this.defaults.sheetNames["character"]], { header: 0 });
            const colNames = this.defaults.colNames["character"];
            for (let i = 0; i < data.length; i++) { // 各データを処理
                const row = data[i];
                if (!(row[colNames["category"]] in this.data.settings.category)) { // 指定カテゴリが存在しない
                    this.state.message.push(`キャラクター「${row[colNames["name"]]}」に指定されたカテゴリ「${row[colNames["category"]]}」の設定が存在しません`);
                    continue;
                };
                let result = {
                    "category": String(row[colNames["category"]]),
                    "birthday": !(row[colNames["autoBirth"]]) ? this.convertSerial2Date(row[colNames["birthday"]]) : this.getBirth(row),
                    "schoolName": (colNames["schoolName"] in row)? String(row[colNames["schoolName"]]).split("_") : [],
                    "schoolOffset": (colNames["schoolOffset"] in row)? String(row[colNames["schoolOffset"]]).split("_") : 0,
                };
                this.data.settings.character[String(row[colNames["name"]])] = result;
                this.data.settings.category[result.category].characters.push(String(row[colNames["name"]]));
            };
        },
        createCharacterSchoolInfo() { // キャラクタ設定から教育課程データを作成
            for (let name in this.data.settings.character) {
                const data = this.data.settings.character[name];
                let result = { "period": {"start": data.birthday, "end": data.birthday}, "details": [] };
                if (data["schoolName"].length != 0) { // 教育課程設定が存在する
                    if (!isNaN(Number(data["schoolOffset"]))) {
                        // 1桁の数字でオフセットが指定されている場合、1桁数字の繰り返し配列に変換
                        data["schoolOffset"] = Array(data["schoolName"].length).fill(Number(data["schoolOffset"]));
                    } else { // 配列の場合、各要素を数値に変換
                        data["schoolOffset"].forEach(function (elem, index) {
                            data["schoolOffset"][index] = (Number(elem) !== NaN) ? Number(elem) : 0;
                        });
                    };
                    if (data["schoolName"].length != data["schoolOffset"].length) { // 教育課程数と開始年齢調整数が噛み合っていない
                        this.state.message.push(`キャラクター「${name}」に設定された教育課程と開始年齢調整の項目数に整合性がありません`);
                        continue;
                    } else {
                        // 教育課程とインターバルに基づきデータを作成
                        const vm = this;
                        const schoolData = this.data.settings.school;
                        this.zip(data["schoolName"], data["schoolOffset"]).forEach(function ([schoolName, offset], index) {
                            const school = schoolData[schoolName];
                            // 入学後最初の誕生日を算出
                            let firstBirthday = new Date(data["birthday"].getTime());
                            firstBirthday.setFullYear(firstBirthday.getFullYear() + school.age + offset);;
                            // 入学1年目期間を仮置き
                            let startDate = new Date(firstBirthday.getFullYear(), school.month - 1, 1);
                            let endDate = new Date(firstBirthday.getFullYear() + 1, school.month - 1, 1);
                            // 期間内に収まっていない場合、期間を1年前倒し
                            if (!(vm.isBetween(firstBirthday, startDate, endDate))) {
                                startDate.setFullYear(startDate.getFullYear() - 1);
                                endDate.setFullYear(endDate.getFullYear() - 1);
                            };
                            // 所属期間を設定
                            endDate.setFullYear(endDate.getFullYear() + school.period - 1);
                            result.period.start = ((result.period.start < startDate) && (result.period.start != data["birthday"])) ? result.period.start : startDate;
                            result.period.end = (result.period.end > endDate) ? result.period.end : endDate;
                            // 詳細を設定
                            result.details.push({
                                "name": schoolName,
                                "start": startDate,
                                "end": endDate,
                            });
                            // 所属期間が前の教育課程に食い込んでいた場合、前の教育課程の期間を繰り上げる
                            if (index > 0) {
                                if (result.details[index - 1].start > startDate) { // 前の教育課程が始まるより前に処理中の教育課程が開始されている
                                    vm.state.message.push(`キャラクター「${name}」の教育課程開始年齢調整が正しく設定されていません`);
                                } else if (result.details[index - 1].end > startDate) {
                                    result.details[index - 1].end = startDate;
                                };
                            };
                        });
                    };
                } else {
                    continue;
                };
                this.data.settings.character[name].school = result;
            };
        },
        createEvent() { // イベント設定を読み込んでフォーマット
            const data = XLSX.utils.sheet_to_json(this.workbook.Sheets[this.defaults.sheetNames["event"]], { header: 0 });
            const settings = this.defaults.displayLimit;
            const colNames = this.defaults.colNames["event"];
            for (let i = 0; i < data.length; i++) { // 各データを処理
                const category = String(data[i][colNames["category"]]);
                const date = this.convertSerial2Date(data[i][colNames["date"]]);
                const limit = (colNames["limit"] in data[i]) ? String(data[i][colNames["limit"]]) : "hour";
                const title = String(data[i][colNames["title"]]);
                const detail = (colNames["detail"] in data[i]) ? String(data[i][colNames["detail"]]) : "";
                if (limit in settings) { // 以降を無視が設定されている場合、それ以降のデータを初期化
                    if (settings[limit] <= 0) date.setMonth(0);
                    if (settings[limit] <= 1) date.setDate(1);
                    if (settings[limit] <= 2) date.setHours(0);
                    if (settings[limit] <= 3) date.setMinutes(0);
                };
                // 対象キャラクタデータを作成
                let characters = [];
                let eventCategory = "";
                if (category == "all") {
                    characters = Object.keys(this.data.settings.character);
                    eventCategory = "all";
                } else if (category in this.data.settings.category) {
                    characters = this.data.settings.category[category].characters;
                    eventCategory = "category";
                } else if (category in this.data.settings.character) {
                    characters = [category];
                    eventCategory = "character";
                } else {
                    this.state.message.push(`イベント「${title}」に指定されたカテゴリないしキャラクター「${category}」が存在しません`);
                    continue;
                };
                // イベントを設定
                const key = date.toISOString() + String(settings[limit]);
                if (Object.keys(this.data.event).indexOf(key) == -1) {
                    this.data.event[key] = {
                        "date": date,
                        "limit": limit,
                        "characters": [],
                        "events": { "all": [], "category": [], "character": [] },
                    };
                };
                const row = {
                    "title": title,
                    "characters": characters,
                    "detail": detail,
                };
                this.data.event[key].events[eventCategory].push(row);
                this.data.event[key].characters = this.union(characters, this.data.event[key].characters);
            };
            // 時系列Keyデータを作成
            const keys = Object.keys(this.data.event);
            keys.sort();
            this.eventKeys = keys;
        },
        async formatData() { // 読み込んだxlsxをフォーマット
            if (this.validData()) {
                await this.createCategory();
                await this.createSchool();
                await this.createCharacter();
                await this.createCharacterSchoolInfo();
                await this.createEvent();
                console.info(this.data);
            };
            if (this.state.message.length != 0) {
                this.state.errorSnack = true;
            };
        },
        async createTimeline() { // タイムラインデータを作成
            
        },
        async init() { // 初期化処理
            const vm = this;
            this.state.ready = false;
            this.state.message = [];
            this.data = JSON.parse(JSON.stringify(this.defaults.data));
            await this.formatData();
            await Object.keys(this.data.settings.category).forEach(key => {
                vm.selectAllCharactersInCategory(key);
            });
            this.state.loading = false;
            this.state.ready = true;
        },
        selectAllCharactersInCategory(category) { // categoryに所属するキャラクタのチェックボックスにチェックを入れる
            const vm = this;
            const characters = this.data.settings.category[category].characters;
            characters.forEach(function (character) {
                if (vm.characterSelected.indexOf(character) == -1) {
                    vm.characterSelected.push(character);
                };
            });
        },
        removeAllCharactersInCategory(category) { // categoryに所属するキャラクタのチェックボックスのチェックを外す
            const vm = this;
            const characters = this.data.settings.category[category].characters;
            characters.forEach(function (character) {
                const index = vm.characterSelected.indexOf(character);
                if (index != -1) {
                    vm.characterSelected.splice(index, 1);
                };
            });
        },
        isCharacterSelected(character) { // 該当キャラクターが選択されているかを返す
            return this.characterSelected.indexOf(character) != -1;
        },
        isFirstEvent(eventKey) { // イベントのキーを受け取ってその年で表示される最初のイベントかを返す
            const targetYear = this.data.event[eventKey].date.getFullYear();
            const index = this.eventKeys.indexOf(eventKey);
            let tf = true;
            for (let i = 0; i < index; i++) { // 自分より前のイベントが表示されるかを確認
                if (targetYear == this.data.event[this.eventKeys[i]].date.getFullYear()) { // 同年のイベント
                    const event = this.data.event[this.eventKeys[i]];
                    if (this.intersection(event.characters, this.characterSelected).length > 0) {
                        tf = false;
                        break;
                    };
                };
            };
            return tf;
        },
        update() { // 描画状態をアップデート

        },
    },
});
