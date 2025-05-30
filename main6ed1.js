function trackGaEvent(category, action, label, eventValue) {
    if (ga) {
        console.log("event", category + " : " + action + " : " + label + " : " + eventValue);
        try {
            ga("send", "event", category, action, label, eventValue);
        } catch (e) {
            // ignore
        }
    }
}
var phoneUtilesjsPath = "/Content/Scripts/Utils.js";
var LogJS = function () {
    var debugFlag = true;

    function logAjaxError(xhr, textStatus, errorThrown) {
        if (debugFlag) {
            console.log("xhr.responseText", xhr.responseText, "textStatus", textStatus, "errorThrown", errorThrown);
        }
    }

    return {
        LogAjaxError: logAjaxError
    }
}();

var LoginModalMainJs = function () {
    var $loginModal;
    var loginContentUrl;
    var contentIsSet = false;
    var preloadAfterInit = false;
    var loginRetries = 0;

    var init = function (loginModalContentUrl) {
        loginContentUrl = loginModalContentUrl;
        $loginModal = $("#loginModal");

        if (preloadAfterInit) {
            preload();
        }
    }; // init

    // preload on the pages that most likely will use it
    function preload(fromInfo) {
        // in case preload runs before init
        if (!loginContentUrl) {
            preloadAfterInit = true;
            return;
        }

        trackGaEvent("LoginModal", "Preload", fromInfo);
        getLoginModalContent(null, false, false);
    }; // preload


    function showLogin(fromInfo, onLoadSuccessFunction, reloginFlag) {
        if (fromInfo) {
            trackGaEvent("LoginModal", "Show", fromInfo);
        }

        if (contentIsSet) {
            refreshTokenShowLoginModal(onLoadSuccessFunction, reloginFlag);
            return;
        };

        getLoginModalContent(onLoadSuccessFunction, reloginFlag, true);
    }; // showLogin

    function showRelogin(fromInfo, onLoadSuccessFunction) {
        trackGaEvent("LoginModal", "Relogin", fromInfo);
        showLogin(null, onLoadSuccessFunction, true);
    }; //showRelogin

    function getLoginModalContent(onLoadSuccessFunction, reloginFlag, showFlag) {
        if (contentIsSet) {
            return;
        }
        var $loginBody = $loginModal.find(".modal-body");
        if (showFlag) {
            // show login with a a spinner during $get
            $loginBody.html(renderSpinner());
            $loginModal.modal("show");
        }

        $.get(loginContentUrl,
            function (html) {
                $loginModal.find(".modal-dialog").html(html);
                contentIsSet = true;
                initLoginModal(true, onLoadSuccessFunction, reloginFlag);
            })
            .fail(function (xhr, textStatus, errorThrown) {
                LogJS.LogAjaxError(xhr, textStatus, errorThrown);
                removeSpinner();
                $loginBody.html("Unexpected Error");
            });

    } // getLoginModal

    function refreshTokenShowLoginModal(onLoadSuccessFunction, reloginFlag, doNotClearFields) {
        var refreshTokenUrl = $("#RefreshTokenUrl").val();
        $.get(refreshTokenUrl,
            function (html) {
                var token = $(html).val();
                $("#loginModalForm").find("input[name=__RequestVerificationToken]").val(token);

                $("#loginModal").modal("show");
                initLoginModal(false, onLoadSuccessFunction, reloginFlag, doNotClearFields);

            });
    }; // refreshTokenShowLoginModal

    function initLoginModal(fistLoad, onLoadSuccessFunction, reloginFlag, doNotClearFields) {
        if (fistLoad) {
            initLoginSubmitEvent();
        }
        else if (!doNotClearFields) {
            clearModalFields();
        }

        if (reloginFlag) {
            showReloginMessage();
        }

        if (onLoadSuccessFunction) {
            onLoadSuccessFunction();
        }
    }; // initLoginModal

    function showReloginMessage() {
        if ($("#reloginMessage").find(".hidden") != undefined) {
            $("#reloginMessage").removeClass("hidden");
        }
    }; // showReloginMessage


    function initLoginSubmitEvent() {
        $("#loginModalForm").on("submit",
            function (e) {
                e.preventDefault();
                e.stopImmediatePropagation();
                $("#loginModalSubmitBtn").attr("disabled", "");
                var origLoginLabel = $("#loginModalSubmitBtn").val();
                $("#loginModalSubmitBtn").val("Logging in...");
                $("#responseContainer").html("");

                $.ajax({
                    url: "/ToastmastersAccount/LoginModal",
                    type: "POST",
                    data: $("#loginModalForm").serialize(),
                    success: function (data) {
                        // debugger;
                        $("#loginModalSubmitBtn").removeAttr("disabled").val(origLoginLabel);
                        if (data.success) {
                            changeHeaderAfterLogin(data.FirstName);
                            loadConsentsModal();
                            $(document).trigger("loginEvent");
                            return;
                        }

                        if (data.resultCode === "AntiForgery" && loginRetries <= 2) {
                            //retry 
                            loginRetries += 1;
                            console.log("retry", loginRetries);
                            var submitLogin = function () { $("#loginModalForm").submit() };
                            refreshTokenShowLoginModal(submitLogin, false, true);
                        }

                        $("#responseContainer").html(data.message);
                    },
                    error: function (xhr, textStatus, errorThrown) {
                        $("#loginModalSubmitBtn").removeAttr("disabled").val(origLoginLabel);
                        $("#responseContainer").html("Unexpected Error");
                        LogJS.LogAjaxError(xhr, textStatus, errorThrown);
                    }
                });
            });

    }; // initLoginSubmitEvent

    function loadConsentsModal() {
        $.ajax({
            url: "/api/sitecore/PrivacyConsent/GetModal",
            type: "GET",
            success: function (data) {
                $("#PrivacyConsentContainer").html(data);
            }
        });
    }

    return {
        Init: init,
        Preload: preload,
        Show: showLogin,
        ShowRelogin: showRelogin
    }
}(); //LoginModalMainJs

function validateNonLatinCharacters() {
    $("input[type='text'], input[type='email'], input[type='search'], textarea").each(function (index, element) {
        var id = element.getAttribute("id");
        var val = $('#' + id).val();
        var regex = /[!@.#\$%\^&\*\(\)_|}{~`">':<\?/\]\[\\=\+\-;\w\s,]*/g;
        var finalString = regex.exec(val);
        if (val != undefined && val != "" && val != null) {
            if (finalString == val) {
                $('#' + id).parent().removeClass('has-error');
                $('#' + id).parent().removeClass('has-danger');
                $('#' + id).parent().find(".help-block").html('');
            }
            else {
                $('#' + id).parent().addClass('has-error');
                $('#' + id).parent().addClass('has-danger');
                $('#' + id).parent().find(".help-block").html('<ul class="list-unstyled"><li>Please remove non latin characters.</li></ul>');
            }
        }
    });
}

$(document).on("click", function () {
    $("input[type='text'], input[type='email'], input[type='search'], textarea").on('keyup keydown change click input', function (event) {
        //Validate only keyboard keys
        var backspaceKey = 8;
        var tabKey = 9;
        var enterKey = 13;
        var shiftKey = 16;
        var capsLockKey = 20;
        var spaceKey = 32;
        var tildKey = 126;
        var hyphenKey = 173;
        var semiColonKey = 186;
        var graveAccentKey = 192;
        var openBracketKey = 219;
        var singleQuoteKey = 222;

        if (event.keyCode == backspaceKey || event.keyCode == tabKey || event.keyCode == enterKey || event.keyCode == hyphenKey || (event.keyCode >= shiftKey && event.keyCode <= capsLockKey) || (event.keyCode >= spaceKey && event.keyCode <= tildKey) || (event.keyCode >= semiColonKey && event.keyCode <= graveAccentKey) || (event.keyCode >= openBracketKey && event.keyCode <= singleQuoteKey) || event.type == "click" || event.type == "change" || event.type == "input") {
            var $target = $(event.target);
            var value = $target.val();
            var regex = /^[\w\s!@.#\$%\^&\*\(\)_|\-–—}{~`"':;,.<>?/\[\]\\=+\u2019\u201c\u201d]*$/;
            var finalString = regex.exec(value);
            $target.val(finalString);
        }
        else {
            event.preventDefault();
        }
    });
});

$(document).ready(function () {

    const urlParams = new URLSearchParams(window.location.search);
    const source = urlParams.get('source');

    if (source == null || source.toLowerCase() != "dashboards") {
        if (window.opener) {
            try {
                if (window.opener) {
                    window.opener.AfterLoginSuccess();
                    window.close();
                }
            } catch (error) {
                console.error("An error occurred while handling the opener window: ", error);
            }
        }
    }

    addthis.toolbox(".addthis_toolbox");

    $(".modal").on("show.bs.modal", function () {
        $("html").css("overflow", "hidden");
        $(".modal-backdrop").removeClass("hide");

    });

    $(".modal").on("hide.bs.modal", function () {
        $("html").attr("style", "");
        $(".modal-backdrop").addClass("hide");
    });

    if ($("#Description .more").children().length <= 0) {
        $("#Description .body").addClass("solo");
    }

    $("#added-to-cart-close").on("click", function () {
        $("#added-to-cart").addClass("hidden");
    });

    $("#added-to-cart-close-button").on("click", function () {
        $("#added-to-cart").addClass("hidden");
    });

    $("#id-continue-shopping").on("click", function () {
        $("#added-to-cart").addClass("hidden");
    });

    $("#id-continue-shopping-view-cart").on("click", function () {
        $("#added-to-cart").addClass("hidden");
    });


    // for membeship dialog
    $("#cart-question-membership-link").on("click", function () {
        $("#cart-question-membership-message").removeClass("hidden");
    });

    // for memberhsip dialog 
    $("#cart-question-membership-message-close").on("click", function () {
        $("#cart-question-membership-message").addClass("hidden");
    });


    $("#btn-add-to-cart-2").on("click", function () {
        $("#added-to-cart").removeClass("hidden");
    });


    $("#body").on("click", ".compare-items.bttn", function () {
        $("#compare-modal").removeClass("hidden");
    });

    $(".bioItem").each(function () {
        $(this).on("click", ".editable.bioImage", function (e) {
            e.preventDefault();
            $("#EditPhoto").show();
        });
        $(this).on("click", ".close", function (e) {
            e.preventDefault();
            $("#EditPhoto").hide();
        });
    });

    /* Adding in 3rd party chat buttons */

    $(".boldChat").each(function () {
        !function (t, e, o, c, n, a) { var s = window.nanorep = window.nanorep || {}; s = s[e] = s[e] || {}, s.apiHost = a, s.host = n, s.path = c, s.account = t, s.protocol = "https:", s.on = s.on || function () { s._calls = s._calls || [], s._calls.push([].slice.call(arguments)) }; var p = s.protocol + "//" + n + c + o + "?account=" + t, l = document.createElement("script"); l.async = l.defer = !0, l.setAttribute("src", p), document.getElementsByTagName("head")[0].appendChild(l) }("toastmasters-cv19", "floatingWidget", "floating-widget.js", "/web/", "toastmasters-cv19.nanorep.co");

        nanorep.floatingWidget.on({
            init: function () {
                this.setConfigId('2217073981');
            }
        });
    });

    /*----------- NAVIGATION FUNCTIONALITY -----------*/

    var $mainNav = $(".mainHeader").find(".mainNav .mainMenu").clone();

    $(".menuWrap .mainNav").append($mainNav);

    $(".mainHeader").on("click", ".navbar-toggle", function (e) {
        e.preventDefault();

        $("body").hasClass("menu-active") ? $("body").off("click", menuToggleHandler) : $("body").on("click", menuToggleHandler);
        $("body").toggleClass("menu-active");
    });

    if (getViewportW() >= 768) {
        var header = $(".mainHeader");
        var secondarymenu = $(".secondary-menu-header");
        header.addClass("affix-top");
        secondarymenu.addClass("affix-top");

        $(window).on("scroll", function () {
            if (window.pageYOffset > 0) {
                header.removeClass("affix-top");
                header.addClass("affix");
                secondarymenu.removeClass("affix-top");
                secondarymenu.addClass("affix");
            } else {
                header.addClass("affix-top");
                header.removeClass("affix");
                secondarymenu.addClass("affix-top");
                secondarymenu.removeClass("affix");
            }
        });
    }

    var menu = $(".mainNav .mainMenu, .secondaryNav .mainMenu"),
        menuContainer = menu.closest(".mainNav");

    menu.find("a").each(function () {
        if ($(this).siblings(".subMenu").length > 0) {
            $(this).addClass("hasSub");
        }
    });

    menu.each(function () {
        $(this).on("click", "a", function (e) {
            var currAnchor = $(this),
                parentLi = currAnchor.closest("li"),
                siblingUl = currAnchor.siblings(".subMenu, ul"),
                isMainTier = currAnchor.siblings().hasClass("subMenu");

            if (siblingUl.length > 0) {
                // Prevent other handlers
                e.preventDefault();

                if (isMainTier) {
                    $("body").off("click", menuHandler);

                    // Toggle close when clicking and open link
                    if (parentLi.hasClass("clicked")) {
                        parentLi.removeClass("clicked").find(".subMenu").slideUp();
                    } else {
                        // Otherwise Open submenu and attach body click handler
                        // Close any other open menus
                        menu.find(".subMenu").slideUp().closest(".clicked").removeClass("clicked");

                        // Open this menu
                        parentLi.addClass("clicked").find(".subMenu").slideDown();

                        $("body").on("click", menuHandler);
                    }
                } else {
                    if (parentLi.hasClass("clicked")) {
                        parentLi.removeClass("clicked").find("ul").slideUp();
                    } else {
                        parentLi.siblings().removeClass("clicked").find("ul").slideUp();
                        parentLi.addClass("clicked").find("ul").slideDown();
                    }
                }
            }
        });

    });

    $(".topHeader").on("click", ".search-toggle", function (e) {
        e.preventDefault();
        var $this = $(this);

        $this.hasClass("active") ? $("body").off("click", searchToggleHandler) : $("body").on("click", searchToggleHandler);
        $this.toggleClass("active").parents(".topHeader").find(".siteSearch").slideToggle();
    });

    function searchToggleHandler(e) {
        if ($(e.target).parents(".siteSearch, .search-toggle").length <= 0 && !$(e.target).hasClass("siteSearch") && !$(e.target).hasClass("search-toggle") && e.originalEvent) {
            $(".search-toggle").trigger("click");
            $("body").off("click", searchToggleHandler);
        }
    }

    function menuToggleHandler(e) {
        if ($(e.target).parents(".menuWrap").length <= 0 && !$(e.target).hasClass("menuWrap") && !$(e.target).hasClass("navbar-toggle") && e.originalEvent) {
            $(".navbar-toggle").trigger("click");
            $("body").off("click", menuToggleHandler);
        }
    }

    function menuHandler(e) {
        if ($(e.target).parents(".mainNav").length <= 0 && $(e.target).parents(".secondaryNav").length <= 0 && e.originalEvent) {
            menu.find(".subMenu").slideUp().closest(".clicked").removeClass("clicked");

            $("body").off("click", menuHandler);
        }
    }

    /*----------- HERO BANNER FUNCTIONALITY -----------*/

    if (getViewportW() >= 768) {
        var x = 1;
        $(".heroBanners").addClass("isMasonry");
        $(".heroBanners .masonry .item").each(function (index, val) {
            var $item = $(val);

            setTimeout(function () {
                lazyLoadImage($item);
            }, (x * 200));
            x++;

            if ($item.hasClass("interactive")) {
                $item.hoverIntent({
                    over: function (e) {
                        if ($item.find(".hoverlay img").length <= 0) {
                            var src = $item.find("img").data("hover-src");
                            $item.find(".hoverlay").append("<img src=" + src + " alt='overlay'/>");
                        }
                        $item.find(".hoverlay").stop(true, true).fadeIn();
                    },
                    out: function (e) {
                        if ($item.find(".hoverlay").length > 0) {
                            $item.find(".hoverlay").stop(true, true).fadeOut();
                        }
                    },
                    timeout: 200
                });
            }
        });
    } else {
        lazyLoadImage($(".heroBanners .slide"));
    }

    /*------------ TIMELINE SLIDER FUNCTIONALITY ------------*/

    $(".timelineCallouts").each(function () {
        var $panels = $(this).find(".panels"),
            $tabs = $(this).find(".tabs"),
            $indicator = $tabs.find(".indicator");

        $tabs.on("click", "a", function (e) {
            e.preventDefault();
            var index = $(this).index(),
                tabMove = (index * 33) + "%",
                panelMove = "-" + (index * 100) + "%";

            $panels.find(".active").removeClass("active");
            $panels.children().eq(index).addClass("active");
            $panels.css("left", panelMove);

            $indicator.css("left", tabMove).text((index + 1));

            if (index > 0) {
                $indicator.addClass("hasPrev hasNext");
                if (index >= $panels.find(".panel").length - 1) {
                    $indicator.removeClass("hasNext");
                }
            } else {
                $indicator.removeClass("hasPrev").addClass("hasNext");
            }

        });
    });

    /*------------ TIMELINE SLIDER FUNCTIONALITY ------------*/

    $(".toolCallouts").each(function () {
        var $container = $(this),
            $panels = $container.find(".panels"),
            $tabs = $container.find(".tabs"),
            $transitionBG;

        $tabs.on("click", "a", function (e) {
            if (getViewportW() >= 768) {
                e.preventDefault();
                var index = $(this).parents().index(),
                    background = $(this).data("bg");

                $tabs.find("a").removeClass("active");
                $(this).addClass("active");

                if (background) {
                    if ($transitionBG) {
                        $transitionBG.stop(true, true);
                        $transitionBG.fadeOut(function () {
                            $transitionBG.css("background-image", "url(" + background + ")").fadeIn(function () {
                                $container.css("background-image", "url(" + background + ")");
                            });
                        });
                    } else {
                        $transitionBG = $("<div class='bg'/>");
                        $transitionBG.css("background-image", "url(" + background + ")").fadeIn(function () {
                            $container.css("background-image", "url(" + background + ")");
                        });
                        $container.prepend($transitionBG);
                    }
                }
                $panels.children().removeClass("active");
                $panels.children().eq(index).addClass("active");
            }
        });
    });

    /*------------ 90th Anniversary ------------*/

    $(".AnniversaryCallouts").each(function () {
        var $container = $(this),
            $panels = $container.find(".panels"),
            $tabs = $container.find(".tabs"),
            $infoPanelsBG = $container.find(".AnniversaryInfoPanels");

        $tabs.on("click", "a", function (e) {
            if (getViewportW() >= 768) {
                e.preventDefault();
                var index = $(this).parents().index(),
                    background = $(this).data("bg");
                $tabs.find("a").removeClass("active");
                $(this).addClass("active");

                if (background) {
                    if ($infoPanelsBG) {
                        $infoPanelsBG.stop(true, true);
                        $infoPanelsBG.fadeOut(0, function () {
                            $infoPanelsBG.css("background-image", "url(" + background + ")");
                            $infoPanelsBG.fadeIn(1000);
                        });
                    }
                }
                $panels.children().removeClass("active");
                $panels.children().eq(index).addClass("active");
            }
        });
    });

    /*------------ GENERAL CALLOUT FUNCTIONALITY ------------*/

    $(".callouts .modHead").on("click", ".title", function (e) {
        var $this = $(this);

        if (getViewportW() < 768 && $this.children("a").length <= 0) {
            e.preventDefault();

            if ($this.hasClass("active")) {
                $this.removeClass("active");
                $this.parents(".modHead").siblings(".modContent").slideUp();
            } else {
                $this.addClass("active");
                $this.parents(".modHead").siblings(".modContent").slideDown();
            }
        }
    });

    $(".callouts .modContent .row").each(function () {
        $(this).find(".callout").matchHeights();
    });

    $(".itemListing .row").each(function () {
        $(this).find(".item").matchHeights();
    });

    /*------------ FIND A CLUB FUNCTIONALITY ------------*/

    var itemListHidden = false;

    $(".findList .nav-tabs").on("click", "a", function (e) {
        e.preventDefault();
        $(".findList .tab-pane").removeClass("hide");
        $(this).tab("show");
    });

    $(".findList .itemList").on("click", "a", function (e) {
        e.preventDefault();
        //PROGRAMMING MAY NEED TO DO SOMETHING LIKE HAVE AN API CALL INSTEAD BUT NEED TO INCLUDE VIEW MAP ASPECT
        if (getViewportW() < 768) {
            $(".findList").find(".nav-tabs .active").removeClass("active");
            $(".findList").find(".tab-pane.active").removeClass("in").addClass("hide");
            itemListHidden = true;
        }

    });

    $(window).resize(function () {
        if (itemListHidden) {
            $(".findList").find(".nav li:first-child a").tab("show");
            itemListHidden = false;
        }
    });

    /*------------ MEMBER SPOTLIGHT FUNCTIONALITY ------------*/
    $(".spotlightList .modHead, .filterList .modHead, .navList .modHead").on("click", ".expander", function (e) {
        e.preventDefault();

        if (getViewportW() < 1200) {
            if (getViewportW() > 1170) {
                $("html").addClass("overflow");
            }
            $(this).closest(".rail").toggleClass("active").find(".modContent").slideToggle();
            $("html").removeClass("overflow");
        }

    });

    /*----------- List Expander ------------*/
    $(".expanderList").on("click", ".expander", function (e) {
        e.preventDefault();

        var expandable = $(this).siblings(".expandable");

        if ($(this).hasClass("open")) {
            $(this).removeClass("open");
            expandable.slideUp();
        } else {
            $(this).addClass("open");
            expandable.slideDown();

            if ($(this).attr("data-transcript").length) {
                var certificateId = $(this).attr("data-transcript");
                var link = $(this);
                $.ajax({
                    url: "/My-Toastmasters/Profile/Award-Transcript",
                    type: "GET",
                    data: { "certificateId": certificateId },
                    success: function (data) {
                        if (data != null) {
                            link.attr("data-transcript", "");
                            var content = $(data).find("#mainContent").html();
                            expandable.find(".row#" + certificateId).html(content);
                        }
                    }
                });
            }
        }
    });

    // This is for handling ajax call without authorized access    
    $(document).ajaxError(function (event, jqXHR, ajaxSettings, thrownError) {
        if (jqXHR.status === 401) {
            LoginModalMainJs.ShowRelogin("ajaxError");
            return;
        }

        LogJS.LogAjaxError(jqXHR, ajaxSettings, thrownError);
    });
});
/* WINDOW LOAD - MOSTLY STYLING ADJUSTMENTS */

$(window).on('load', function () {
    if ($(".siteWrap.home").length > 0) {
        document.getElementById("logoLink").focus();
    }

    $(".callouts .modContent .row").each(function () {
        $(this).find(".callout").matchHeights();
    });

    $(".itemListing .row").each(function () {
        $(this).find(".item").matchHeights();
    });

    var recalcHeights = debounce(function () {

        $(".callouts .modContent .row").each(function () {
            $(this).find(".callout").css("minHeight", 0);
            $(this).find(".callout").matchHeights();
        });

        $(".itemListing .row").each(function () {
            $(this).find(".item").css("minHeight", 0);
            $(this).find(".item").matchHeights();
        });
    });

    $(window).resize(recalcHeights);
});


/*----------- LAZY LOADER FOR HERO BANNERS, ETC. -----------*/

function lazyLoadImage($container) {
    var $image = $container.find("img"),
        src = $image.data("src");

    $image.attr("src", src).on("load error", function () {
        $(this).fadeIn(function () {
            $container.addClass("loaded");
        });
    });

    if ($image.complete || typeof $image.complete === "undefined") {
        $image.fadeIn(function () {
            $container.addClass("loaded");
        });
    }
}

/*----------- DEBOUNCER -----------*/

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.

function debounce(func, wait, immediate) {
    var timeout;
    return function () {
        var context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        }, wait);
        if (immediate && !timeout) func.apply(context, args);
    };
};

/*----------- GET VIEWPORT -----------*/

var getViewportW = function () {
    var win = typeof window != "undefined" && window,
        doc = typeof document != "undefined" && document,
        docElem = doc && doc.documentElement;

    var a = docElem["clientWidth"], b = win["innerWidth"];
    return a < b ? b : a;
};

/*----------- Helper Functions -----------*/

function changeHeaderAfterLogin(firstName) {
    var memberLink = $("<a></a>");
    memberLink.text("Welcome, " + firstName);
    memberLink.attr("href", "/My-Toastmasters/Profile");
    memberLink.attr("class", "welcomeInfo");
    var oldMemberLink = $("#memberNav").find(".welcomeInfo");
    if (oldMemberLink != undefined) {
        oldMemberLink.remove();
    }
    $("#memberNav").prepend(memberLink);

    $("#cartLink").attr("href", "/My-Toastmasters/Profile/View-Cart");

    $("#navItem_0").attr("href", "/Logout");
    $("#navItem_0").text("Logout");
}

function clearModalFields() {
    $("#responseContainer").html("");
    $("#UserName").val("");
    $("#Password").val("");
}

function renderSpinner() {
    return "<i id='spinner' class='fa fa-spinner fa-pulse fa-3x fa-fw centerSpinner' aria-hidden='true'></i>";
}

function removeSpinner() {
    $("#spinner").remove();
}

$(document).on("submit",
    ".siteSearchForm",
    function () {
        var form = $(this);
        var term = form.find("input").val();
        var url = "/search?q=" + encodeURIComponent(term) + "&t=contentTab";
        form.prop("action", url);
    });

$(document).on("click", "#acBtnSiteSearch", function () { searchAC(this); });

$(document).on("keyup", "#acTxtSiteSearch",
    function (e) {
        if (e.which === 13 || e.keyCode === 13) {
            searchAC(this);
        }
    });

function searchAC(element) {
    var term = $(element).closest(".siteSearch").find("input").val();
    var url = "/search#q=" + encodeURIComponent(term) + "&t=contentTab";

    window.location.href = url;
}

AddAntiForgeryToken = function (data) {
    data.__RequestVerificationToken = $("input[name=__RequestVerificationToken]").val();
    return data;
};

// Checks for number key press event
function isNumberKey(evt) {
    var charCode = (evt.which) ? evt.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57))
        return false;
    return true;
}

(function (TI, $, undefined) {
    TI.GetTranslation = function (key, fallback, callback) {
        if (fallback === undefined) {
            fallback = "";
        }

        if (key === undefined) {
            return fallback;
        }

        try {
            if (callback !== undefined) {
                var url = "/api/translate/" + encodeURI(key);
                $.ajax(url).done(function (data) {
                    callback(data);
                });
            }
        }
        catch (error) {
            return fallback;
        }
    }
})(window.TI = window.TI || {}, jQuery);

function tiExtend(ns, nsString, definition) {
    // https://addyosmani.com/blog/essential-js-namespacing/
    var parts = nsString.split("."),
        parent = ns, i;

    if (parts[0] === "TI") {
        parts = parts.slice(1);
    }

    var pl = parts.length;
    for (i = 0; i < pl; i++) {
        //create a property if it doesnt exist
        if (typeof parent[parts[i]] == "undefined") {
            parent[parts[i]] = {};
        }

        parent = parent[parts[i]];
    }

    if (jQuery.isEmptyObject(parent)) {
        // Don't re-define
        definition(parent, jQuery);
    }
}

function trackClickEvent(category, label, element) {
    if (element === undefined || element === null) {
        return;
    }

    try {
        element.on("click", function () {
            ga("send", "event", category, "click", label);
            return true;
        });
    }
    catch (exception) {
        // 
    }

    return;
}

// --- Google Analytics --- //
const GA_CATEGORIES = {
    PWA: "Progressive Web App"
}

function trackEvent(category, action, label, value) {
    /// <summary>Track event with Google Analytics</summary>
    /// <param name="category" type="String">Category</param>
    /// <param name="action" type="String">Action</param>
    /// <param name="label" type="String">Label (optional)</param>
    /// <param name="value" type="Integer">Value (optional)</param>

    if (!category || !action) return;

    if (typeof (ga) != 'undefined') {
        if (value) {
            ga('send', 'event', category, action, label, value);
        } else if (label) {
            ga('send', 'event', category, action, label);
        } else if (action) {
            ga('send', 'event', category, action);
        }
    }
}

function initPhoneControl(doneCallBack, autoPlaceholdervalue, formatOnDisplayvalue) {
    var phoneOptions =
    {
        initialCountry: "auto",
        geoIpLookup: function (callback, doneCallBack) {
            $.get('https://api.ipstack.com/check?access_key=9762c38e9b1d7ecfadbee3f776ef7d82&output=json&legacy=1', function () { }, "jsonp")
                .always(function (resp) {
                    var countryCode = (resp && resp.country_code) ? resp.country_code : "";
                    callback(countryCode);
                })
                .done(function (resp) {
                    if (doneCallBack) {
                        doneCallBack(resp);

                    } else {
                        defaultDone(resp);
                    }
                })
                .fail(function () {
                    console.log("ipinfo failed");
                });
        },
        formatOnDisplay: formatOnDisplayvalue,
        autoPlaceholder: autoPlaceholdervalue,
        allowExtensions: true,
        utilsScript: phoneUtilesjsPath
    };

    return phoneOptions;
}

function initPhone(doneCallBack, autoPlaceholdervalue, formatOnDisplayvalue) {
    var phoneOptions =
    {
        initialCountry: "auto",
        geoIpLookup: callback => {
            fetch('https://api.ipstack.com/check?access_key=9762c38e9b1d7ecfadbee3f776ef7d82&output=json&legacy=1')
                .then(response => response.json())
                .then(resp => {
                    var countryCode = (resp && resp.country_code) ? resp.country_code : "";
                    callback(countryCode);
                    if (doneCallBack) {
                        doneCallBack(resp);
                    } else {
                        defaultDone(resp);
                    }
                })
                .catch(error => {
                    console.log("ipinfo failed");
                });

        },
        formatOnDisplay: formatOnDisplayvalue,
        autoPlaceholder: autoPlaceholdervalue,
        allowExtensions: true,
        utilsScript: phoneUtilesv23jsPath,
        formatAsYouType: false
    };
    return phoneOptions;
}

function defaultDone(resp) {
    if (resp && resp.country_code) {
        _countryCode = resp.country_code.toLowerCase();
        if ($(".phone-iso")) {
            initIntlPhoneIso();
        } else {
            initIntlPhoneIso1();
        }

    }
}

function initIntlPhoneIso() {
    if (_countryCode) {
        $(".phone-iso").each(function () {
            if ($(this).val() === "")
                $(this).val(_countryCode);
        });
    }
}

function initIntlPhoneIso1() {
    if (_countryCode) {
        if ($("#PhoneIso2").val() === "") {
            $("#PhoneIso2").val(_countryCode);
        }
    }
}

function RedirectB2CLogin() {
    if ($("#CurrentActionName").length > 0) {
        var CurrentActionName = $("#CurrentActionName").val().toLowerCase();
        var CurrentControllerName = $("#CurrentControllerName").val().toLowerCase();
        var CurrentpostingLink = $("#CurrentpostingLink").val().toLowerCase();
        var locationRedirect = B2CLoginRedirect + "?returnUrl=" + window.location.pathname + "&CurrentActionName=" + CurrentActionName + "&CurrentControllerName=" + CurrentControllerName + "&CurrentpostingLink=" + CurrentpostingLink;
        location.href = locationRedirect;
    }
    else {
        var locationRedirect = B2CLoginRedirect + "?returnUrl=" + window.location.pathname;
        location.href = locationRedirect;
    }
}