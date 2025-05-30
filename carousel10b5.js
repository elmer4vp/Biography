$(document).ready(function () {
    $("#txtKeyword").keyup(function (event) {
        if (event.keyCode == 13) {
            $("#btnGo").click();
        }
    });
});

function search() {
    var txtKeyword = $("#txtKeyword");
    window.location = '/search#q=' + txtKeyword.val() + '&t=productsTab&f:SearchScope=[Products]&f:SearchScope:not=[Content]';
}

$(document).ready(function () {
    if (!String.prototype.format) {
        String.prototype.format = function () {
            var args = arguments;
            return this.replace(/{(\d+)}/g, function (match, number) {
                return typeof args[number] != 'undefined'
                  ? args[number]
                  : match
                ;
            });
        };
    }

    if ($('#carouselId').length > 0) {
        var id = $('#carouselId').val();
        var uri = "/api/carousel/slides?carouselId=" + id;
        var counter = 0;
        var container = $('#' + id + '_slides');
        container.empty();
        var indicators = $('#' + id + '_indicators');
        $.getJSON(uri).done(function (data) {
            $.each(data, function (key, item) {
                var cssClass = "item";
                var indicatorClass = "";
                if (counter == 0) {
                    cssClass = cssClass + " active";
                    indicatorClass = " class='active'";
                }
                indicators.append(getIndicators().format(counter, indicatorClass));
                counter++;
                var newSlideHtml = getSlideStr().format(cssClass, item.ImageUrl, item.ImageAlt, item.Title, item.Price, item.ShortDescription, item.Url);
                container.append(newSlideHtml);
            });
            if (indicators.children("li").length == 1) {
                indicators.append("<li style='display: none'><img hidden /></li>");
            }
        });
    }

    function getIndicators() {
        return "<li data-target='#carousel-example-generic' data-slide-to='{0}' {1}><img hidden/></li>";
    }

    function getSlideStr() {
        return "<div class='{0}'><div class='carousel-image-wrap'><div class='carousel-image'><span><img src='{1}' alt='{2}'></span></div></div><div class='carousel-caption'><div class='content-wrap'><div class='content-inner'><h2 class='title'>{3}</h2><p class='price'>{4}<span style='font-size: 16px; display:block; font-weight: bold;'>Member Price</span></p><p class='description'>{5}</p><a href='{6}' class='btn btn-primary'>SHOP NOW</a></div></div></div></div>";
    }

});
