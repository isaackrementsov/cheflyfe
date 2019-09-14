let key = 'rfLFsPbM3Ym3WhFPZg3zAbc7v0Pv9nhuX7MIxSJo';
let offset = 0;
let currentTerm;
let header = $('#search-db-header');
let more = $('#search-db-more')
let container = $('#search-db-container');
let incConversions = $('#search-db-conversions');

function searchDB(){
    let term = $('#search-db-input').val();

    if(term != '' || offset != 0){
        header.html('<div class="brigade"><span>Name</span><span style="width: 20%">Brand</span></div>');

        if(term != currentTerm){
            currentTerm = term;
            container.html('');
        }

        $.ajax(`https://api.nal.usda.gov/ndb/search/?format=json&q=${term}&max=10&offset=${offset}&api_key=${key}`, {
                method: 'GET',
                dataType: 'json',
                success: res => {
                    if(res.list){
                        let ingredients = res.list.item;

                        for(let ingredient of ingredients){
                            container.append(`
                                <div class="brigade" style="font-size: 13px">
                                    <i class="material-icons" style="color: #8C9EFF; cursor: pointer"
                                    onclick="addDB(` + '`' + ingredient.name + '`, `' + ingredient.manu + '`, `' + ingredient.ndbno + '`)">' + `
                                        add
                                    </i>
                                    <span style="width: 80%">${ingredient.name}</span>
                                    <div style="width: 20%; font-weight: normal">
                                        ${ingredient.manu}<br>
                                    </div>
                                </div>
                            `);
                        }

                        more.html(`
                            <div class="brigade">
                                <span style="color: #8C9EFF; cursor: pointer" onclick="loadMore()">Load more</span>
                            </div>
                        `)
                    }else{
                        container.append(`
                            <div class="brigade" style="font-size: 13px">
                                <span style="width: 80%; color: coral">You've submitted too many requests. Try again later</span>
                            </div>
                        `);
                    }
                }
            });
    }
}

function loadMore(){
    offset += 10;
    searchDB();
}

function addDB(name, brand, id){
    toggle('search-db', 'search-db-form');
    $('#add-ingredient').hide();
    $('#add-ingredient-form').show();

    $('#add-ingredient-form input[name="name"]').val(name);
    $('#add-ingredient-form input[name="brandOpt"]').val(brand);

    let inc = incConversions.is(':checked');

    $.ajax(`https://api.nal.usda.gov/ndb/reports/?ndbno=${id}&type=${inc ? 'b' : 's'}&format=json&api_key=${key}`, {
        method: 'GET',
        dataType: 'json',
        success: res => {
            let info = res.report.food.nutrients;
            let dbUnits;
            let dbQt;

            if(inc){
                let m = info[0].measures;
                dbUnits = m[0].label;
                dbQt = 1;
                let dbE = {units: m[0].eunit, qt: m[0].eqv};

                for(let i = 1; i < m.length; i++){
                    let measure = m[i];

                    if(measure.eunit == dbE.units){
                        let mUnits = measure.label;
                        let mQt = Math.round(100 * dbE.qt / measure.eqv)/100;

                        $('#add-ingredient-form input#qt-0').val(mQt);
                        $('#add-ingredient-form input#units-0').val(mUnits);
                        addConversion(0);
                   }
                }
            }else{
                dbUnits = 'g';
                dbQt = 100;
            }

            $('#add-ingredient-form input[name="qtJSON"]').val(dbQt);
            $('#add-ingredient-form input[name="units"]').val(dbUnits);

            $('#nutritional-info-form').show();

            for(let value of info){
                let valueNum = parseFloat(value.value);

                switch(value.nutrient_id){
                    case '208':
                        $('#nutritional-info-form input[name="calsOptJSON"]').val(valueNum);
                        break;
                    case '204':
                        $('#nutritional-info-form input[name="fatOptJSON"]').val(valueNum);
                        break;
                    case '606':
                        $('#nutritional-info-form input[name="satFatOptJSON"]').val(valueNum);
                        break;
                    case '601':
                        $('#nutritional-info-form input[name="cholOptJSON"]').val(valueNum);
                        break;
                    case '307':
                        $('#nutritional-info-form input[name="sodOptJSON"]').val(valueNum);
                        break;
                    case '205':
                        $('#nutritional-info-form input[name="carbsOptJSON"]').val(valueNum);
                        break;
                    case '291':
                        $('#nutritional-info-form input[name="fibOptJSON"]').val(valueNum);
                        break;
                    case '269':
                        $('#nutritional-info-form input[name="sugOptJSON"]').val(valueNum);
                        break;
                    case '203':
                        $('#nutritional-info-form input[name="protOptJSON"]').val(valueNum);
                        break;
                }
            }

            $('#nutritional-info-form input[name="fatCalsOptJSON"]').val(0);
            $('#nutritional-info-form input[name="transFatOptJSON"]').val(0);

            $('#nutritional-info-form input').each(function(e){
                if($(this).val() == '') $(this).attr('value', 0);
            });
        }
    });
}
