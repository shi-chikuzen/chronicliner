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
            "sheetNames": { "category": "カテゴリー", "character": "キャラクター", "school": "教育課程", "event": "イベント" },
            "colNames": {
                "category": { "name": "カテゴリ名", "color": "カテゴリ色", "bgcolor": "カテゴリ色" },
                "character": { "name": "キャラクタ名", "category": "カテゴリ", "birthday": "誕生日", "schoolName": "教育課程名", "schoolOffset": "開始年齢調整", "autoBirth": "誕生年自動計算", "autoYear": "起算年", "autoSchool": "起算課程", "autoGrade": "起算学年" },
                "school": { "name": "名称", "period": "年数", "month": "開始月", "age": "開始年齢" },
                "event": { "category": "カテゴリ", "title": "タイトル", "date": "日時", "limit": "以降を無視", "detail": "詳細" },
            },
            "displayLimit": { "month": 0, "day": 1, "hour": 2, "minute": 3, "second": 4 },
            "backgroundColor": "rgb(247, 248, 247)",
            "borderColor": "rgb(229, 229, 229)",
        },
        data: { "settings": { "category": {}, "character": {}, "school": {}, }, "event": {}, "characters": [] },
        characterSelected: [],
        eventKeys: [],
        timelineHeaders: [],
        timelineData: [],
        yearSummary: {},
        tableHeight: 0,
    },
    computed: {
        snackMessage: function () {
            return this.state.message.join("<br>");
        },
        colsTL: function () {
            return this.data.characters.map(name => name + "_tl");
        },
        colsEV: function () {
            return this.data.characters.map(name => name + "_ev");
        },
        timelineDataShow: function () {
            let data = [];
            let currentYear = -1;
            for (const row of this.timelineData) {
                const summarize = this.yearSummary[row.year].show;
                if ((currentYear != row.year) && (summarize == true)) {
                    data.push(this.yearSummary[row.year]);
                } else if (summarize == true) {
                    // rowをskipする
                } else {
                    data.push(row);
                };
                currentYear = row.year;
            };
            return data;
        },
    },
    mounted: function () {
        this.defaults.data = JSON.parse(JSON.stringify(this.data));
        window.addEventListener("resize", this.windowResized);
        this.$nextTick(function () {
            this.setTableHeight();
        });
    },
    beforeDestroy: function () {
        window.removeEventListener("resize", this.windowResized);
    },
    watch: {
        workbook: 'init',
        characterSelected: 'update',
    },
    methods: {
        // Utils
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
        fillTimeByZero(val) { // 時刻をゼロ埋めする
            return ("0" + String(val)).slice(-2);
        },
        isBetween(target, start, end) { // targetがstart以上end未満かを返す
            return (target >= start) && (target < end);
        },
        // File
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
        // Get Info
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
                    this.state.message.push(`キャラクター「${data[colNames["name"]]}」に指定された起算年数が、起算課程「${autoSchool}」の期間設定を超過しています`);
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
        getYearPassed(start, end) { // 経過年数（切り捨て）を返す
            const years = Math.floor((end.getTime() - start.getTime()) / (365 * 24 * 60 * 60 * 1000));
            return years;
        },
        isCharacterSelected(character) { // 該当キャラクターが選択されているかを返す
            return this.characterSelected.indexOf(character) != -1;
        },
        getCardColor(category) { // カードの色を返却
            if (category == "all") {
                return '';
            } else if (category in this.data.settings.category) {
                return this.data.settings.category[category].color;
            } else {
                return this.defaults.backgroundColor;
            };
        },
        returnCardTextClass(category) { // カードの表示モードを返却
            if (category in this.data.settings.category) {
                return 'white--text';
            } else {
                return '';
            };
        },
        returnCardClass(index, events) { // rowにあるカードの数に応じてマージン設定クラスを返す
            const numEvents = events.length;
            if (numEvents == 0 || index == numEvents - 1) {
                return "my-2";
            } else {
                return "mb-4 mt-2";
            };
        },
        // Create Base Data
        createCategory() { // カテゴリ設定を読み込んでフォーマット
            const data = XLSX.utils.sheet_to_json(this.workbook.Sheets[this.defaults.sheetNames["category"]], { header: 0 });
            const colNames = this.defaults.colNames["category"];
            for (let i = 0; i < data.length; i++) { // 各データを処理
                let row = {
                    "color": (colNames["color"] in data[i]) ? String(data[i]["カテゴリ色"]) : this.defaults.color[i % this.defaults.color.length],
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
                const characterName = String(row[colNames["name"]]);
                let result = {
                    "category": String(row[colNames["category"]]),
                    "birthday": !(row[colNames["autoBirth"]]) ? this.convertSerial2Date(row[colNames["birthday"]]) : this.getBirth(row),
                    "schoolName": (colNames["schoolName"] in row)? String(row[colNames["schoolName"]]).split("_") : [],
                    "schoolOffset": (colNames["schoolOffset"] in row)? String(row[colNames["schoolOffset"]]).split("_") : 0,
                };
                this.data.characters.push(characterName);
                this.data.settings.character[characterName] = result;
                this.data.settings.category[result.category].characters.push(characterName);
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
        createCharacterBirthday() { // キャラクタ設定から誕生日イベントを生成
            let rows = [];
            const colNames = this.defaults.colNames["event"];
            for (const [name, character] of Object.entries(this.data.settings.character)) {
                let data = {};
                data[colNames["category"]] = name;
                data[colNames["date"]] = character.birthday;
                data[colNames["limit"]] = "hour";
                data[colNames["title"]] = `${name}誕生`;
                rows.push(data);
            };
            return rows;
        },
        createEvent() { // イベント設定を読み込んでフォーマット
            const xlsx = XLSX.utils.sheet_to_json(this.workbook.Sheets[this.defaults.sheetNames["event"]], { header: 0 });
            const birthday = this.createCharacterBirthday();
            const data = xlsx.concat(birthday);
            const settings = this.defaults.displayLimit;
            const colNames = this.defaults.colNames["event"];
            for (let i = 0; i < data.length; i++) { // 各データを処理
                const category = String(data[i][colNames["category"]]);
                const date_original = data[i][colNames["date"]];
                const date = (typeof(date_original) === "object") ? date_original : this.convertSerial2Date(date_original);
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
                    "category": category,
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
        createYearSummary() { // 年ごとのサマリーデータをフォーマットする
            let yearSummary = {}
            for (const key of this.eventKeys) {
                const year = Number(key.slice(0, 4));
                const date = new Date(year, 0, 1);
                yearSummary[year] = {
                    "year": year,
                    "date": date,
                    "characters": this.data.characters,
                    "displayLimit": this.defaults.displayLimit["month"],
                    "show": false,
                    "isFirstEvent": true,
                };
                for (characterName of this.data.characters) {
                    const character = this.data.settings.character[characterName];
                    yearSummary[year][`${characterName}_ev`] = [{
                        "title": "",
                        "category": characterName,
                        "characters": [characterName],
                        "numEvents": { "all": 0, "category": 0, "character": 0 },
                        "detail": "",
                    }];
                    yearSummary[year][`${characterName}_tl`] = {
                        "name": characterName,
                        "age": this.getYearPassed(character.birthday, date),
                        "school": {},
                        "color": this.data.settings.category[character.category].color,
                        "needsArrow": true,
                        "summary": true,
                    };
                };
            };
            this.yearSummary = yearSummary;
        },
        async formatData() { // 読み込んだxlsxをフォーマット
            if (this.validData()) {
                await this.createCategory();
                await this.createSchool();
                await this.createCharacter();
                await this.createCharacterSchoolInfo();
                await this.createEvent();
                await this.createYearSummary();
            };
            if (this.state.message.length != 0) {
                this.state.errorSnack = true;
            };
        },
        // Create Table Data
        createTimelineData() { // タイムラインデータを作成
            const vm = this;
            let data = [];
            this.eventKeys.forEach(function (key) {
                const date = vm.data.event[key].date;
                const year = date.getFullYear();
                const eventData = vm.data.event[key].events;
                // Template
                let template = {
                    "year": date.getFullYear(),
                    "date": date,
                    "characters": [],
                    "displayLimit": vm.defaults.displayLimit[vm.data.event[key].limit],
                    "show": true,
                    "isFirstEvent": true,
                };
                for (const [key, category] of Object.entries(vm.data.settings.category)) {
                    const characters = category.characters;
                    characters.forEach(function (characterName) {
                        const character = vm.data.settings.character[characterName];
                        template[`${characterName}_tl`] = {
                            "name": characterName,
                            "age": vm.getYearPassed(character.birthday, date),
                            "school": vm.getCharacterSchoolInfo(characterName, date),
                            "color": vm.data.settings.category[character.category].color,
                            "needsArrow": true,
                            "summary": false,
                        };
                        template[`${characterName}_ev`] = [];
                    });
                };
                // Events
                const categories = ["all", "category", "character"];
                for (const categoryName of categories) {
                    if (eventData[categoryName].length > 0) { // イベントが存在する場合処理
                        let row = Vue.util.extend({}, template);
                        eventData[categoryName].forEach(function (event) {
                            row.characters = vm.union(row.characters, event.characters);
                            for (const characterName of event.characters) {
                                row[`${characterName}_ev`].push(event);
                                vm.yearSummary[year][`${characterName}_ev`][0]["numEvents"][categoryName] += 1;
                            };
                        });
                        data.push(row);
                    };
                };
            });
            this.timelineData = data;
        },
        createTimelineColumns() { // characterSelectedの更新に合わせてtableColumnの表示状態を更新
            const vm = this;
            const width = (100 - 6) / this.characterSelected.length;
            let headers = [{ text: '', value: "year", class:["border-none"], cellClass: ["valign-top", "pt-4"], width: "6%", }];
            for (const [key, category] of Object.entries(this.data.settings.category)) {
                const characters = category.characters;
                characters.forEach(function (character) {
                    if (vm.characterSelected.indexOf(character) != -1) {
                        headers.push({ text: '', value: `${character}_tl`, class:["table-timeline-header", "border-none"], cellClass: ["pa-0", "table-timeline-cell", "line-height-none", "font-size-zero"], width: "0%", });
                        headers.push({ text: character, value: `${character}_ev`, width: `${width}%`, class: ["border-none"], cellClass: ["pl-2", "pr-4"] });
                    };
                });
            };
            this.timelineHeaders = headers;
        },
        updateTimelineData() { // characterSelectedの更新に合わせてshowの状態を更新
            let currentAge = {};
            this.colsTL.forEach(function (colName) {
                currentAge[colName] = -1;
            });
            let currentYear = -1;
            for (let index = 0; index < this.timelineData.length; index++) {
                const row = this.timelineData[index];
                // 列がshow状態かどうかを判断
                if (this.intersection(this.characterSelected, row.characters).length > 0) {
                    row.show = true;
                    // Year列の表示状態変更
                    if (currentYear != row.year) {
                        currentYear = row.year;
                        row.isFirstEvent = true;
                    } else {
                        row.isFirstEvent = false;
                    };
                    // 誕生日の切り替え状態を変更（needsArrow）
                    for (tlKey of this.colsTL) {
                        const tlTd = row[tlKey];
                        if (tlTd.age != currentAge[tlKey] && tlTd.age >= 0) {
                            currentAge[tlKey] = tlTd.age;
                            tlTd.needsArrow = true;
                        } else {
                            tlTd.needsArrow = false;
                        };
                    };
                } else {
                    // 非表示行
                    row.show = false;
                };
            };
        },
        updateYearSummary() { // 集計したイベント数をもとにtitleを設定する
            for (const year in this.yearSummary) {
                for (const characterName of this.data.characters) {
                    const numEvents = this.yearSummary[year][`${characterName}_ev`][0].numEvents;
                    this.yearSummary[year][`${characterName}_ev`][0].title = `ALL: ${numEvents.all}件\nカテゴリ: ${numEvents.category}件\nキャラクタ: ${numEvents.character}件`;
                };
            };
        },
        // Functions
        async init() { // 初期化処理
            const vm = this;
            this.state.ready = false;
            this.state.message = [];
            this.data = JSON.parse(JSON.stringify(this.defaults.data));
            await this.formatData();
            await this.updateYearSummary();
            await Object.keys(this.data.settings.category).forEach(key => {
                vm.selectAllCharactersInCategory(key);
            });
            await this.createTimelineData();
            await this.updateTimelineData();
            this.state.loading = false;
            this.state.ready = true;
        },
        async update() { // 表示キャラクター変更時にデータリセットとスタイリングを行う
            await this.resetHeights();
            await this.createTimelineColumns();
            await this.updateTimelineData();
            await this.setBorders();
            await this.setHeights();
        },
        async windowResized() { // windowサイズ変更時にtdの高さを設定し直す
            await this.setTableHeight();
            await this.resetHeights();
            await this.setHeights();
        },
        toggleYearSummaryShow(year) { // 要約行に切り替えるかどうかを設定
            this.yearSummary[year].show = !this.yearSummary[year].show;
        },
        // Filter
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
        // Styling
        setBorders() { // 適切なborderを設定
            if ("timeline" in this.$refs) {
                const vm = this;
                let table = document.querySelector("#timeline");
                let rows = table.querySelectorAll("tbody > tr");
                this.zip(this.timelineDataShow, rows).forEach(function ([row, dom], index) {
                    const borderColor = (row.isFirstEvent) ? vm.defaults.borderColor : "#FFFFFF";
                    let tds = dom.querySelectorAll("td");
                    for (let i = 0; i < tds.length; i++){
                        // 各tdのデフォルトを無効化
                        tds[i].style.borderBottom = "thin none rgba(0, 0, 0, 0)";
                        if (i % 2 == 0) { // 年区切りのborderを設定
                            tds[i].style.borderTop = `thin solid ${borderColor}`;
                        } else {
                            const color = tds[i].querySelector(".v-sheet").dataset.color;
                            tds[i].style.backgroundColor = color;
                        };
                    };
                });
            };
        },
        setHeights() { //適切なHeightを設定
            if ("timeline" in this.$refs) {
                const table = document.querySelector("#timeline");
                const tds = table.querySelectorAll("tbody > tr > td.table-timeline-cell");
                tds.forEach(function (td) {
                    const sheet = td.querySelector(".v-sheet");
                    sheet.style.height = String(td.clientHeight) + "px";
                });
            };
        },
        resetHeights() { // setHeightsで設定したHeightをリセットする
            if ("timeline" in this.$refs) {
                const table = document.querySelector("#timeline");
                const tds = table.querySelectorAll("tbody > tr > td.table-timeline-cell");
                tds.forEach(function (td) {
                    const sheet = td.querySelector(".v-sheet");
                    sheet.style.height = "0px";
                });
            };
        },
        setTableHeight() {
            const windowHeight = window.innerHeight;
            const sumPadding = 46;
            const tableTop = document.querySelector("#timelineParent").getBoundingClientRect();
            this.tableHeight = windowHeight - tableTop.y - sumPadding;
        },
    },
});
