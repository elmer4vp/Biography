/*global $, jQuery*/
/*jslint plusplus: true*/

/*!
* jQuery Feedback Me Plugin
* 
* File:			jquery.feedback_me.js
* Version:		0.5.6
* 
* Author:      Daniel Reznick
* Info:        https://github.com/vedmack/feedback_me 
* Contact:     vedmack@gmail.com
* Twitter:	   @danielreznick
* Q&A		   https://groups.google.com/forum/#!forum/daniels_code	
* 
* Copyright 2013 Daniel Reznick, all rights reserved.
* Copyright 2013 Licensed under the MIT License (just like jQuery itself)
* 
* This source file is distributed in the hope that it will be useful, but 
* WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY 
* or FITNESS FOR A PARTICULAR PURPOSE. See the license files for details.
*/
/*
* Parameters:
*
*					
* -------------

* feedback_url
				Required:			true
				Type:				String
				Description:		URL of your servlet/php etc ('name', 'message' and 'email' parameters will be send to your servlet/php etc...)

* position				
				Required:			false
				Type:				String
				Default value:		left-top
				Possible values:	left-top / left-bottom / right-top / right-bottom 
				Description:		Set the position where the feedback widget will be located
* jQueryUI
				Required:			false
				Type:				boolean
				Default value:		false
				Description:		Tell the plugin to use jQuery UI theme

* bootstrap
				Required:			false
				Type:				boolean
				Default value:		false
				Description:		Tell the plugin to use twitter bootstrap

* show_email
				Required:			false
				Type:				boolean
				Default value:		false
				Description:		Tell the plugin to display email input field

* show_radio_button_list
				Required:			false
				Type:				boolean
				Default value:		false
				Description:		Tell the plugin to set of 5 radio buttons
				
* name_label
				Required:			false
				Type:				String
				Default value:		"Name"
				Description:		Label for name input

* email_label
				Required:			false
				Type:				String
				Default value:		"Email"
				Description:		Label for email input

* message_label
				Required:			false
				Type:				String
				Default value:		"Message"
				Description:		Label for message input

* radio_button_list_labels
				Required:			false
				Type:				Array of 5 strings
				Default value:		["1","2","3","4","5"]
				Description:		Labels for radio button list

* radio_button_list_title
				Required:			false
				Type:				String
				Default value:		"How would you rate my site?"
				Description:		Label that will appear above the list of radio button
				
* submit_label
				Required:			false
				Type:				String
				Default value:		"Send"
				Description:		Label for submit input

* title_label
				Required:			false
				Type:				String
				Default value:		"Feedback"
				Description:		Label for title text

* trigger_label
				Required:			false
				Type:				String
				Default value:		"Feedback"
				Description:		Label for open/close (trigger) button

* name_placeholder
				Required:			false
				Type:				String
				Default value:		""
				Description:		Watermark for name input

* email_placeholder
				Required:			false
				Type:				String
				Default value:		""
				Description:		Watermark for email input

* message_placeholder
				Required:			false
				Type:				String
				Default value:		""
				Description:		Watermark for message input

* name_pattern				
				Required:			false
				Type:				String
				Default value:		""
				Description:		Set name input pattern, you must escape your '\' chars (\ ---> \\)

* name_required
				Required:			false
				Type:				boolean
				Default value:		false
				Description:		Makes input required

* email_required
				Required:			false
				Type:				boolean
				Default value:		false
				Description:		Makes input required

* message_required
				Required:			false
				Type:				boolean
				Default value:		false
				Description:		Makes input required

* radio_button_list_required
				Required:			false
				Type:				boolean
				Default value:		false
				Description:		Makes radio inputs required

* show_asterisk_for_required
				Required:			false
				Type:				boolean
				Default value:		false
				Description:		Add an asterisk to the label of the required inputs

* close_on_click_outside				
				Required:			false
				Type:				boolean
				Default value:		true
				Description:		Will cause the feedback dialog to be closed on clicking anywhere outside the dialog
				
* custom_params				
				Required:			false
				Type:				object
				Default value:		{}
				Description:		Use it if you want to send additional data to the server (can be used for sending: csrf token / logged in user_name / etc`)
* iframe_url				
				Required:			false
				Type:				String
				Default value:		undefined
				Description:		Allows you to use any html file that you want, it will be placed inside feedback_me widget, (note that in order to close the feedback_me widget
									just call the following command: parent.fm.triggerAction(event, "left-top"); don't forget to pass the "event" from you onclick call to the triggerAction function
									and also the position of your feedback widget left-top / left-bottom / right-top / right-bottom)
* show_form				
				Required:			false
				Type:				boolean
				Default value:		true
				Description:		Allows you to hide the form in the widget (and only show HTML code or iframe)
* custom_html				
				Required:			false
				Type:				String
				Default value:		""
				Description:		Allows you to use any inline html code that you want, it will be placed inside feedback_me widget
* delayed_close 
				Required:			false
				Type:				boolean
				Default value:		true
				Description:		Enable feedback dialog upon feedback sending, a small dialog will be displayed with	appropriate message in the middle
									of the screen and then fade out (read more about the delayed_options property)
* delayed_options
				Required:			false
				Type:				object
				Default value:
									{
										delay_success_milliseconds : 2000,
										delay_fail_milliseconds : 2000,
										sending : "Sending...", //This text will appear on the "send" button while sending
										send_fail : "Sending failed.", //This text will appear on the fail dialog
										send_success : "Feedack sent.", //This text will appear on the success dialog
										fail_color : undefined,
										success_color : undefined
									}
				Description:		Allow to customize the feedback dialog upon feedback sending
*
*
*/
var fm = (function ($) {

	'use strict';

	var fm_options_arr = {},
		supportsTransitions = false;

	function getFmOptions(event, position) {
		var className,
			selector;
		if ($(event.target).closest(".feedback_trigger").length === 1) {
			className = $(event.target).closest(".feedback_trigger")[0].className;
		} else if ($(event.target).closest(".feedback_content").length === 1) {
			className = $(event.target).closest(".feedback_content")[0].className;
		} else {
			if (position === undefined) {
				position = 'left-top';
			}
			className = position;
		}

		if (className.indexOf('left-top') !== -1) {
			selector = 'left-top';
		} else if (className.indexOf('left-bottom') !== -1) {
			selector = 'left-bottom';
		} else if (className.indexOf('right-top') !== -1) {
			selector = 'right-top';
		} else if (className.indexOf('right-bottom') !== -1) {
			selector = 'right-bottom';
		}
		return fm_options_arr[selector];
	}

	function triggerAction(event, position) {

		var animation_show = {},
			animation_hide = {},
			$fm_trigger,
			$fm_content;

		animation_show.marginLeft = "+=380px";
		animation_hide.marginLeft = "-=380px";

		if (fm.getFmOptions(event, position).position.indexOf("right-") !== -1) {
			animation_show.marginRight = "+=380px";
			animation_hide.marginRight = "-=380px";
		}

		$fm_trigger = $(event.target).closest(".feedback_trigger");
		if ($fm_trigger.length === 1) {
			$fm_content = $fm_trigger.next();
		} else {
			$fm_content = $(event.target).closest(".feedback_content");
			$fm_trigger = $fm_content.prev();
		}
		if ($fm_content.length === 0 || $fm_trigger.length === 0) {
			if (position === undefined) {
				position = 'left-top';
			}
			$fm_content = $('.' + position).closest(".feedback_content");
			$fm_trigger = $fm_content.prev();
		}

		if ($fm_trigger.hasClass("feedback_trigger_closed")) {
			if (supportsTransitions === true) {
				$fm_trigger.removeClass("feedback_trigger_closed");
				$fm_content.removeClass("feedback_content_closed");
			} else {
				$fm_trigger.add($fm_content).animate(
					animation_show,
					150,
					function () {
						$fm_trigger.removeClass("feedback_trigger_closed");
						$fm_content.removeClass("feedback_content_closed");
					}
				);
			}
			$(".feedback_email").focus();
		} else {
			//first add the closed class so double (which will trigger closeFeedback function) click wont try to hide the form twice
			$fm_trigger.addClass("feedback_trigger_closed");
			$fm_content.addClass("feedback_content_closed");
			if (supportsTransitions === false) {
				$fm_trigger.add($fm_content).animate(
					animation_hide,
					150
				);
			}
		}
	}

	function closeFeedback(event) {

		if (($(".feedback_content").length === 1 && $(".feedback_content").hasClass("feedback_content_closed")) ||
				$(event.target).closest('.feedback_content').length === 1) {
			return;
		}

		var animation_hide = {},
			option;
		animation_hide.marginLeft = "-=380px";
		for (option in fm_options_arr) {
			if (fm_options_arr.hasOwnProperty(option)) {
				if (option.indexOf("right-") !== -1) {
					animation_hide.marginRight = "-=380px";
				}

				$(".feedback_trigger").addClass("feedback_trigger_closed");
				$(".feedback_content").addClass("feedback_content_closed");
				if (supportsTransitions === false) {
					$(".feedback_trigger , .feedback_content").animate(
						animation_hide,
						150
					);
				}
			}
		}
	}

	function emailValid(str) {
		var lastAtPos = str.lastIndexOf('@');
		return (lastAtPos < (str.length - 1) && lastAtPos > 0 && str.indexOf('@@') === -1 && str.length > 2);
	}

	function validateFeedbackForm(event, position) {
		var $fm_content = $(event.target).closest(".feedback_content"),
			fm_options = getFmOptions(event, position);
		if ((fm_options.name_required === true && $fm_content.find(".feedback_name").val() === "") ||
				((fm_options.email_required === true && $fm_content.find(".feedback_email").val() === "") || (fm_options.email_required === true && emailValid($fm_content.find(".feedback_email").val()) === false)) ||
				(fm_options.message_required === true && $fm_content.find(".feedback_message").val() === "") ||
				(fm_options.radio_button_list_required === true && $fm_content.find("input[name=rating]:checked").val() === undefined)) {
			return false;
		}
		return true;

	}

	function checkPatternFieldsOk(event, position) {
		var $patternFields = $("." + position + " [pattern]"),
			form_valid = true,
			i;

		if ($patternFields.length > 0) {
			for (i = 0; i < $patternFields.length; i++) {
				form_valid = !$patternFields[i].validity.patternMismatch;
				if (form_valid === false) {
					break;
				}
			}
		}
		return form_valid;
	}

	function checkRequiredFieldsOk(event, position) {
		var $reqFields = $("." + position + " [required]"),
			form_valid = true;

		if ($reqFields.length > 0) {
			form_valid = validateFeedbackForm(event, position);
		}
		return form_valid;
	}

	function applyCloseOnClickOutside() {
		var jqVersion = $().jquery.split(".");
		jqVersion[0] = +jqVersion[0];
		jqVersion[1] = +jqVersion[1];
		if (jqVersion[0] >= 1 && jqVersion[1] >= 7) {
			$(document).on("click", document, function (event) {
				closeFeedback(event);
			});
		} else {
			$(document).delegate("body", document, function (event) {
				closeFeedback(event);
			});
		}
	}

	function appendFeedbackToBody(fm_options) {
		var form_html = "",
			iframe_html = "",
			jQueryUIClasses1 = "",
			jQueryUIClasses2 = "",
			jQueryUIClasses3 = "",
			jQueryUIClasses4 = "",
			email_html = "",
			email_feedback_content_class = "",
			radio_button_list_html = "",
			radio_button_list_class = "",
			fm_class = " fm_clean ",
			jquery_class = "",
			bootstrap_class = "",
			bootstrap_btn = "",
			bootstrap_hero_unit = "",

			name_pattern = fm_options.name_pattern === "" ? "" : "pattern=\"" + fm_options.name_pattern + "\"",

			name_required = fm_options.name_required ? "required" : "",
			email_required = fm_options.email_required ? "required" : "",
			message_required = fm_options.message_required ? "required" : "",
			radio_button_list_required = fm_options.radio_button_list_required ? "required" : "",

			name_asterisk  = fm_options.name_required && fm_options.show_asterisk_for_required ? "<span class=\"required_asterisk\">*</span>" : "",
			email_asterisk  = fm_options.email_required && fm_options.show_asterisk_for_required ? "<span class=\"required_asterisk\">*</span>" : "",
			message_asterisk  = fm_options.message_required && fm_options.show_asterisk_for_required ? "<span class=\"required_asterisk\">*</span>" : "",
			radio_button_list_asterisk = fm_options.radio_button_list_required && fm_options.show_asterisk_for_required ? "<span class=\"required_asterisk\">*</span>" : "";

		if (fm_options.bootstrap === true) {
			bootstrap_class = " fm_bootstrap ";
			bootstrap_btn = " btn btn-primary ";
			bootstrap_hero_unit = " hero-unit ";

			fm_class = "";
			jquery_class = "";
		}

		if (fm_options.jQueryUI === true) {
			jquery_class = " fm_jquery ";
			jQueryUIClasses1 = " ui-widget-header ui-corner-all ui-helper-clearfix ";
			jQueryUIClasses2 = " ui-dialog ui-widget ui-widget-content ui-corner-all ";
			jQueryUIClasses3 = " ui-dialog-titlebar ";
			jQueryUIClasses4 = " ui-dialog-title ";

			fm_class = "";
			bootstrap_class = "";
			bootstrap_hero_unit = "";
			bootstrap_btn = "";

		}

		if (fm_options.show_radio_button_list === true) {
			radio_button_list_html = "<li><div class=\"radio_button_list_title_wrapper\"><div class=\"radio_button_list_title\">" + fm_options.radio_button_list_title + radio_button_list_asterisk + "</div></div><span class=\"star-rating star-5\">";
			radio_button_list_html += "        <input value=\"1\" type=\"radio\" name=\"rating\" class=\"rating_1\" id=\"rating_1\" " + radio_button_list_required + "\/><i></i>";
			radio_button_list_html += "        <label for=\"rating_1\">" + fm_options.radio_button_list_labels[0] + "<\/label>";
			radio_button_list_html += "        <input value=\"2\" type=\"radio\" name=\"rating\" class=\"rating_2\" id=\"rating_2\" \/><i></i>";
			radio_button_list_html += "        <label for=\"rating_2\">" + fm_options.radio_button_list_labels[1] + "<\/label>";
			radio_button_list_html += "        <input value=\"3\" type=\"radio\" name=\"rating\" class=\"rating_3\" id=\"rating_3\"\/><i></i>";
			radio_button_list_html += "        <label for=\"rating_3\">" + fm_options.radio_button_list_labels[2] + "<\/label>";
			radio_button_list_html += "        <input value=\"4\" type=\"radio\" name=\"rating\" class=\"rating_4\" id=\"rating_4\"\/><i></i>";
			radio_button_list_html += "        <label for=\"rating_4\">" + fm_options.radio_button_list_labels[3] + "<\/label>";
			radio_button_list_html += "        <input value=\"5\" type=\"radio\" name=\"rating\"  class=\"rating_5\" id=\"rating_5\"\/><i></i>";
			radio_button_list_html += "        <label for=\"rating_5\">" + fm_options.radio_button_list_labels[4] + "<\/label>";
			radio_button_list_html += "<\/span></li>";

			radio_button_list_class = " radio_button_list_present";
		}

		if (fm_options.show_email === true) {
			email_html = '<li>	<span class="radiolabelspan" style="font-weight: 600;font-family: Arial, Sans-Serif;">' + fm_options.email_label + '</span> ' + email_asterisk + '<input type="email" aria-label="feedback_email" name="feedback_email" aria-required="true" id="feedback_email" autocomplete="email" class="feedback_email" ' + email_required + ' placeholder="' + fm_options.email_placeholder + '"></input> </li>';
			email_feedback_content_class = " email_present";
		}

		if (fm_options.show_form === true) {
			form_html = '<form class="feedback_me_form">'
				+	'<ul>'

				+		 email_html

				+ '<li>	<span class="radiolabelspan" style="font-weight: 600;font-family: Arial, Sans-Serif;">' + fm_options.message_label + '</span> ' + message_asterisk

				+ ' <textarea rows="5" name="feedback_message" id="feedback_message" aria-required="true"  autocomplete="on" class="feedback_message" ' + message_required + ' onkeydown="textCounter(this,500)" aria-label="feedback_message" onkeyup="textCounter(this,500)" maxlength=500 placeholder="' + fm_options.message_placeholder + '"></textarea> <input id="feedbackLenGoal" aria-label="feedbackLenGoal" style="text-align: right; width:20px; border: none !important; font-size: 8pt; background-color:transparent; color:white" readonly="readonly" type="text"  value="500" autocomplete="on"/> <font style="font-size: 8pt;">character(s) remaining</font></li>'

				+		 radio_button_list_html
                + '<li><button type="button" style="margin-left: 150px;" onclick="fm.stopPropagation(event);fm.triggerAction(event);">Close</button><button type="submit" onclick="fm.sendFeedback(event,\'' + fm_options.position + '\');" class="feedback_submit ' + bootstrap_btn + '">' + fm_options.submit_label + '</button> </li>'
				+	'</ul>'
				+	'</form>';
		}
		if (fm_options.iframe_url !== undefined) {
			iframe_html = '<iframe name="feedback_me_frame" class="feedback_me_frame" frameborder="0" src="' + fm_options.iframe_url + '"></iframe>';
		}

		$('body').append('<div style="display:none" onclick="fm.stopPropagation(event);fm.triggerAction(event);" class="feedback_trigger feedback_trigger_closed ' + fm_options.position + jQueryUIClasses1 + fm_class + jquery_class + bootstrap_class + bootstrap_hero_unit + ' hidden-print">'
				+	'<span class="feedback_trigger_text">' + fm_options.trigger_label
				+	'</span></div>');

		$('body').append('<div class="feedback_content feedback_content_closed ' + fm_options.position + email_feedback_content_class + radio_button_list_class + jQueryUIClasses2 + fm_class + jquery_class + bootstrap_class + bootstrap_hero_unit + ' hidden-print">'
							+ '<div class="feedback_title ' + jQueryUIClasses1 + jQueryUIClasses3 + '">'
							+	'<span class="' + jQueryUIClasses4 + '">' + fm_options.title_label + '</span>'
							+ '</div>'
							+  form_html
							+  iframe_html
							+  fm_options.custom_html
						+ '</div>');

		if (fm_options.jQueryUI === true) {
			$('.feedback_submit').button({
				icons: {
					primary: 'ui-icon-mail-closed'
				}
			});
		}

		if (fm_options.close_on_click_outside === true) {
			applyCloseOnClickOutside();
		}

		//prevent form submit (needed for validation)
		$('.feedback_me_form').submit(function (event) {
			event.preventDefault();
		});

	}

	function stopPropagation(evt) {
		if (evt.stopPropagation !== undefined) {
			evt.stopPropagation();
		} else {
			evt.cancelBubble = true;
		}
	}

	function slideBack(fm_options, $fm_trigger, $fm_content) {
		var animation_hide = {};
		animation_hide.marginLeft = "-=380px";
		if (fm_options.position.indexOf("right-") !== -1) {
			animation_hide.marginRight = "-=380px";
		}

		if (supportsTransitions === true) {
			$fm_trigger.addClass("feedback_trigger_closed");
			$fm_content.addClass("feedback_content_closed");
		} else {
			$fm_trigger.add($fm_content).animate(
				animation_hide,
				150,
				function () {
					$fm_trigger.addClass("feedback_trigger_closed");
				}
			);
		}
	}
	function clearInputs(event) {
		var $fm_content = $(event.target).closest(".feedback_content");

		$fm_content.find(".feedback_name").val("");
		$fm_content.find(".feedback_message").val("");
		$fm_content.find(".feedback_email").val("");
		$fm_content.find(".feedback_me_form input[name=rating]").prop('checked', false);
	}

	function sendFeedback(event, position) {
		var checkValid = checkRequiredFieldsOk(event, position),
			checkPattern = checkPatternFieldsOk(event, position),
			dataArray,
			$fm_trigger,
			$fm_content,
			fm_options = getFmOptions(event, position);

		if (checkValid === false || checkPattern === false) {
			stopPropagation(event);
			return;
		}

		$fm_content = $(event.target).closest(".feedback_content");
		$fm_trigger = $(event.target).closest(".feedback_content").prev();

		if (fm_options.delayed_close === true) {
			$fm_content.find('.feedback_submit').text(fm_options.delayed_options.sending);
		}

	    var email = $fm_content.find(".feedback_email").val();
	    var message = $fm_content.find(".feedback_message").val();
        message += "\n\n" + FS.getCurrentSessionURL(true);
	    var rating = $fm_content.find(".feedback_me_form input[name=rating]:checked").val();

		dataArray = {
			"name": $fm_content.find(".feedback_name").val(),
			"message": message,
			"email": email,
			"radio_list_value": rating,
			"url": $(location).attr('href')
		};

		dataArray = $.extend(fm_options.custom_params, dataArray);

		$.ajax({
			type: 'POST',
			url: fm_options.feedback_url,
			data: dataArray,
			beforeSend: function (xhr) {
				if (fm_options.delayed_close === false) {
					slideBack(fm_options, $fm_trigger, $fm_content);
				}
			},
			success: function (data) {
				var st = "";
				fm.clearInputs(event);
				if (fm_options.delayed_close === true) {
					if (fm_options.delayed_options.success_color !== undefined) {
						st = ' style="background-color:' + fm_options.delayed_options.success_color + '" ';
					}
					$fm_content.find('.feedback_submit').text(fm_options.submit_label);
					slideBack(fm_options, $fm_trigger, $fm_content);
					$("body").append('<div ' + st + ' class="feedback-delayed-dlg success" onclick="fm.stopPropagation(event);"><span class="feedback-dlg-close" onclick="fm.closeFeedbackDelayedDlg();">X</span><span class="feedback-sucess-message">' +
						'<span class="feedback-sucess-fail-message-inner"><span>' + fm_options.delayed_options.send_success + '</span></span></span></div>');
					setTimeout(function () {$(".feedback-delayed-dlg").fadeOut(function () { $(this).remove(); }); }, fm_options.delayed_options.delay_success_milliseconds);
				}
            },
			error: function (ob, errStr) {
				var st = "";
				if (fm_options.delayed_close === true) {
					if (fm_options.delayed_options.fail_color !== undefined) {
						st = ' style="background-color:' + fm_options.delayed_options.fail_color + '" ';
					}
					$fm_content.find('.feedback_submit').text(fm_options.submit_label);
					$("body").append('<div ' + st + ' class="feedback-delayed-dlg fail" onclick="fm.stopPropagation(event);"><span class="feedback-dlg-close" onclick="fm.closeFeedbackDelayedDlg();">X</span><span class="feedback-fail-message">' +
						'<span class="feedback-sucess-fail-message-inner"><span>' + fm_options.delayed_options.send_fail + '</span></span></span></div>');
					setTimeout(function () {$(".feedback-delayed-dlg").fadeOut(function () { $(this).remove(); }); }, fm_options.delayed_options.delay_fail_milliseconds);
				} else {
					console.log("Failed to send feedback (please double check your feedback_url parameter)");
				}
				clearInputs(event);
			}
		});

	    sendFeedbackToSlack(email, message, rating);
	}

    function sendFeedbackToSlack(email, message, rating) {
        $.ajax({
            url: "/api/sitecore/Feedback/SendFeedback",
            method: "POST",
            data: {
                "Message": message,
                "Email": email,
                "Rating": rating
            }
        });
    }

	function closeFeedbackDelayedDlg() {
		$(".feedback-delayed-dlg").fadeOut();
	}

	function detectTransitionSupport() {
		var be = document.body || document.documentElement,
			style = be.style,
			p = 'transition',
			vendors,
			i;
		if (typeof style[p] === 'string') {
			supportsTransitions = true;
			return;
		}

		vendors = ['Moz', 'Webkit', 'Khtml', 'O', 'ms'];
		p = p.charAt(0).toUpperCase() + p.substr(1);
		for (i = 0; i < vendors.length; i++) {
			if (typeof style[vendors[i] + p] === 'string') {
				supportsTransitions = true;
				return;
			}
		}
		supportsTransitions = false;
		return;
	}

	function init(options) {

		var default_options = {
			feedback_url : "",
			position : "left-top",
			jQueryUI : false,
			bootstrap : false,
			show_email : false,
			show_radio_button_list : false,
			close_on_click_outside: true,
			name_label : "Name",
			email_label : "Email",
			message_label : "Message",
			radio_button_list_labels : ["1", "2", "3", "4", "5"],
			radio_button_list_title : "How would you rate my site?",
			name_placeholder : "",
			email_placeholder : "",
			message_placeholder : "",
			name_pattern : "",
			name_required : false,
			email_required : false,
			message_required: false,
			radio_button_list_required : false,
			show_asterisk_for_required : false,
			submit_label : "Send",
			title_label : "Feedback",
			trigger_label : "Feedback",
			custom_params : {},
			iframe_url : undefined,
			show_form: true,
			custom_html : "",
			delayed_close : true,
			delayed_options : {
				delay_success_milliseconds : 2000,
				delay_fail_milliseconds : 2000,
				sending : "Sending...",
				send_fail : "Sending failed.",
				send_success : "Feedack sent.",
				fail_color : undefined,
				success_color : undefined
			}
		},
			tmp_options,
			tmp_delayed_options;

		tmp_delayed_options = $.extend(default_options.delayed_options, options.delayed_options);

		tmp_options = $.extend(default_options, options);
		tmp_options.delayed_options = tmp_delayed_options;

		fm_options_arr[tmp_options.position] = tmp_options;

		appendFeedbackToBody(tmp_options);

		detectTransitionSupport(tmp_options);
	}

    return {
		init : init,
		sendFeedback : sendFeedback,
		getFmOptions : getFmOptions,
		triggerAction : triggerAction,
		stopPropagation : stopPropagation,
		clearInputs : clearInputs,
		closeFeedbackDelayedDlg : closeFeedbackDelayedDlg
    };

}(jQuery));
