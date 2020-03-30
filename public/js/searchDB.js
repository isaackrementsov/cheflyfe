let key = 'Z5mhbMyAHdpQP99RGY1L7YuzQyFuW1J1FRb9ZZPc';
let page = 1;
let currentTerm;
let header = $('#search-db-header');
let more = $('#search-db-more')
let container = $('#search-db-container');
let incConversions = $('#search-db-conversions');

function searchDB(){
    let term = $('#search-db-input').val();

    if(term != '' || page != 1){
        header.html('<div class="brigade"><span>Description</span><span style="width: 20%">Brand</span></div>');

        if(term != currentTerm){
            currentTerm = term;
            container.html('');
        }

        $.ajax(`https://api.nal.usda.gov/fdc/v1/search?api_key=${key}`, {
                method: 'GET',
                dataType: 'json',
                data: {'generalSearchInput': term, 'pageNumber': page},
                success: res => {
                    if(res.foods){
                        let ingredients = res.foods;

                        for(let ingredient of ingredients){
                            container.append(`
                                <div class="brigade" style="font-size: 13px">
                                    <i class="material-icons" style="color: #8C9EFF; cursor: pointer"
                                    onclick="addDB(` + '`' + ingredient.description + '`, `' + (ingredient.brandOwner || "") + '`, `' + ingredient.fdcId + '`)">' + `
                                        add
                                    </i>
                                    <span style="width: 80%">${ingredient.description}</span>
                                    <div style="width: 20%; font-weight: normal">
                                        ${ingredient.brandOwner || 'No brand'}<br>
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
    page += 1;
    searchDB();
}

function addDB(name, brand, id){
    toggle('search-db', 'search-db-form');
    $('#add-ingredient').hide();
    $('#add-ingredient-form').show();

    $('#add-ingredient-form input[name="name"]').val(name);
    $('#add-ingredient-form input[name="brandOpt"]').val(brand);

    let inc = incConversions.is(':checked');

    $.ajax(`https://api.nal.usda.gov/fdc/v1/${id}?api_key=${key}`, {
        method: 'GET',
        dataType: 'json',
        success: res => {
            let info = res.labelNutrients;
            let dbUnits = res.servingSizeUnit;
            let dbQt = res.servingSize;

            $('#add-ingredient-form input[name="qtJSON"]').val(dbQt);
            $('#add-ingredient-form input[name="units"]').val(dbUnits);

            $('#nutritional-info-form').show();

            for(let value of Object.keys(info)){
                let valueNum = parseFloat(info[value].value);

                switch(value){
                    case 'calories':
                        $('#nutritional-info-form input[name="calsOptJSON"]').val(valueNum);
                        break;
                    case 'fat':
                        $('#nutritional-info-form input[name="fatOptJSON"]').val(valueNum);
                        break;
                    case 'saturatedFat':
                        $('#nutritional-info-form input[name="satFatOptJSON"]').val(valueNum);
                        break;
                    case 'cholesterol':
                        $('#nutritional-info-form input[name="cholOptJSON"]').val(valueNum);
                        break;
                    case 'sodium':
                        $('#nutritional-info-form input[name="sodOptJSON"]').val(valueNum);
                        break;
                    case 'carbohydrates':
                        $('#nutritional-info-form input[name="carbsOptJSON"]').val(valueNum);
                        break;
                    case 'fiber':
                        $('#nutritional-info-form input[name="fibOptJSON"]').val(valueNum);
                        break;
                    case 'sugars':
                        $('#nutritional-info-form input[name="sugOptJSON"]').val(valueNum);
                        break;
                    case 'protein':
                        $('#nutritional-info-form input[name="protOptJSON"]').val(valueNum);
                        break;
                    case 'transFat':
                        $('#nutritional-info-form input[name="transFatOptJSON"]').val(valueNum);
                }
            }

            $('#nutritional-info-form input[name="fatCalsOptJSON"]').val(0);

            $('#nutritional-info-form input').each(function(e){
                if($(this).val() == '') $(this).attr('value', 0);
            });
        }
    });
}
