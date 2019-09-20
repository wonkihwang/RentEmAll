$(".num-only").keypress(function (e) {
        if (e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57)) {
                return false;
        }
});

/*********************************** Call Review Stars ***********************************/
$.fn.generateStars = function () {
        return this.each(function (i, e) {
                $(e).html($('<span/>').width($(e).text() * 16));
        });
};
$('.star-prototype').generateStars();

/* Post Review */
$('#stars li').on('mouseover', function () {
        var onStar = parseInt($(this).data('value'), 10);

        $(this).parent().children('li.star').each(function (e) {
                if (e < onStar) {
                        $(this).addClass('hover');
                }
                else {
                        $(this).removeClass('hover');
                }
        });
}).on('mouseout', function () {
        $(this).parent().children('li.star').each(function (e) {
                $(this).removeClass('hover');
        });
});

$('#stars li').on('click', function () {
        var onStar = parseInt($(this).data('value'), 10);
        var stars = $(this).parent().children('li.star');

        for (i = 0; i < stars.length; i++) {
                $(stars[i]).removeClass('selected');
        }

        for (i = 0; i < onStar; i++) {
                $(stars[i]).addClass('selected');
        }

        var ratingValue = parseInt($('#stars li.selected').last().data('value'), 10);

        $('#ratingVal').val(ratingValue);
});

// Display error message when posing more than one review per item
$('#reviewExistErrorModal').modal('show');

/*********************************** Review Validation ***********************************/
/********** Validate when submit **********/
function reviewValidation() {
        $(".errorMsg").empty();

        return validateReviewTitle() && validateReviewText();
}

/********** Validate review title **********/
function validateReviewTitle() {
        var elem = document.querySelector("#title");
        var reviewTitle = elem.value.trim();

        if (reviewTitle.length < 1) {
                showErrors("titleError", "Review Title should be filled in.")
                elem.focus();
                return false;
        }
        else if (reviewTitle.length > 20) {
                showErrors("titleError", "Review Title should not exceed 20 characters.")
                elem.focus();
                return false;
        }

        return true;
}

/********** Validate review contents **********/
function validateReviewText() {
        var elem = document.querySelector("#review");
        var reviewText = elem.value.trim();

        if (reviewText.length < 1) {
                showErrors("reviewTextError", "Please leave a review.")
                elem.focus();
                return false;
        }
        else if (reviewText.length > 200) {
                showErrors("reviewTextError", "Review cannot exceed 200 characters.")
                elem.focus();
                return false;
        }

        return true;
}

/* FAQ */
$('.collapse').on('shown.bs.collapse', function () {
        $(this).parent().find(".glyphicon-plus").removeClass("glyphicon-plus").addClass("glyphicon-minus");
}).on('hidden.bs.collapse', function () {
        $(this).parent().find(".glyphicon-minus").removeClass("glyphicon-minus").addClass("glyphicon-plus");
});

/*********************************** Register Validation ***********************************/
/********** Validate when submit **********/
function formValidation() {
        /* clearErrors(); */
        $(".errorMsg").empty();
        return validUsername() && validPassword() && validFirstName() && validLastName() && validEmail() && validPhoneNum() && validPostalCode() && validTerms();
}

/********** Validate when editing user profile **********/
function profileValidation() {
        /* clearErrors(); */
        var validPW = true;
        $(".errorMsg").empty();
        if ($('#ChangePasswordBtn').data('clicked')) {
                validPW = validPassword()
        }
        return validPW && validEmail() && validPhoneNum() && validPostalCode();
}

/********** Username validation **********/
function validUsername() {
        var elem = document.querySelector("#username");
        var input = elem.value.trim();
        if (input.length < 6) {
                showErrors('username_errors', "Username must have at least 6 characters.");
                elem.focus(); return false;
        }
        if (input.length > 20) {
                showErrors('username_errors', "Username must be maximum 20 characters.");
                elem.focus(); return false;
        }
        if (/[^a-zA-Z0-9\-\_]/.test(input)) {
                showErrors('username_errors', "Only alphanumeric, - and _ are allowed.")
                elem.focus(); return false;
        }
        return true;
}

/********** Password validation **********/
function validPassword() {
        var valid = false;
        var alphaCap = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        var elem = document.querySelector("#password");
        var input = elem.value.trim();
        if (input.length < 8) {
                showErrors('password_errors', "Password must have at least 8 characters.");
                elem.focus(); return false;
        }
        if (input.length > 20) {
                showErrors('password_errors', "Password must be maximum 20 characters.");
                elem.focus(); return false;
        }
        for (var i = 0; i < input.length; i++) {
                if (alphaCap.indexOf(input.substr(i, 1)) >= 0) {
                        valid = true;
                }
        }
        if (valid) {
                var digit = 0;
                for (var i = 0; i < input.length; i++) {
                        if (parseInt(input[i])) {
                                digit++;
                        }
                }
                if (digit == 0) {
                        valid = false;
                }
        }
        if (!valid) {
                showErrors('password_errors', "Password Must have at least 1 digit and 1 uppercase.");
                elem.focus(); return false;
        }
        var elem2 = document.querySelector("#retypePW");
        var input2 = elem2.value.trim();
        if (input != input2) {
                showErrors('password_errors', "Password does not match the confirm password.");
                elem2.focus(); return false;
        }
        return true;
}

/********** Name validation **********/
function validFirstName() {
        return validName("#firstname");
}
function validLastName() {
        return validName("#lastname");
}
function validName(name) {
        var charCount = 0;
        var elem = document.querySelector(name);
        var input = elem.value.trim();
        if (input.length == 0) {
                showErrors('name_errors', "Name is required.");
                elem.focus(); return false;
        }
        if (input.length > 30) {
                showErrors('name_errors', "Name must be maximum 30 characters.");
                elem.focus(); return false;
        }
        if (/[^a-zA-Z\-\']/.test(input)) {
                showErrors('name_errors', "Only alphabets and apostrophe/hyphen are allowed.")
                elem.focus(); return false;
        }
        input = input.toUpperCase();
        for (var i = 0; i < input.length; i++) {
                if (input.charAt(i) >= "A" && input.charAt(i) <= "Z") {
                        charCount++;
                }
        }
        if (charCount === 0) {
                showErrors('name_errors', "Name must contain a letter.");
                elem.focus(); return false;
        }
        return true;
}

/********** Email address validation **********/
function validEmail() {
        var elem = document.querySelector("#email");
        var input = elem.value.trim();
        var regex = /^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;   /* regex format: abc123@email.com */
        if (!regex.test(input)) {
                showErrors('email_errors', "Email address is not valid.");
                elem.focus(); return false;
        }
        return true;
}

/********** Terms and Conditions validation **********/
function validTerms() {
        if ($('#termsCheck').prop("checked") == false) {
                showErrors('terms_errors', "You must agree to terms and conditions.");
                return false;
        }
        return true;
}

/********** Phone number validation **********/
function validPhoneNum() {
        var elem = document.querySelector("#phoneNum");
        var input = elem.value.trim();
        var regex = /^[0-9]{10}$/;           /* regex format: 4161232345 */
        /* array of all Canadian valid area codes */
        var areaCodes = ["416", "647", "437", "403", "587", "825", "780", "250",
                "778", "236", "604", "204", "431", "506", "709", "867", "902", "782",
                "519", "226", "548", "613", "343", "705", "249", "807", "905", "289",
                "365", "418", "581", "450", "579", "514", "438", "819", "873", "306", "639"];
        var areaValid = false;
        if (!input) {
                showErrors('phone_errors', "Phone number must be 10 numbers.");
                elem.focus(); return false;
        }
        if (input.length > 0) {
                if (!regex.test(input)) {
                        showErrors('phone_errors', "Phone number must be 10 numbers only.");
                        elem.focus(); return false;
                }
                var phoneArea = input.substr(0, 3);
                for (var i = 0; i < areaCodes.length; i++) {
                        if (phoneArea == areaCodes[i]) {
                                areaValid = true;
                        }
                }
                if (!areaValid) {
                        showErrors('phone_errors', "Invalid Canadian area code is entered.");
                        elem.focus(); return false;
                }
        }
        return true;
}

/********** Postal code validation **********/
function validPostalCode() {
        var elem = document.querySelector("#postalcode");
        var input = elem.value.trim();
        var regex = /^[a-zA-Z][0-9][a-zA-Z][0-9][a-zA-Z][0-9]$/;   /* regex format: A1A1A1 */
        if (!regex.test(input)) {
                showErrors('postal_errors', "Postal code is not valid.");
                elem.focus(); return false;
        }
        return true;
}

/********** Show error message function **********/
function showErrors(id, message) {
        document.getElementById(id).innerHTML = message;
}
function clearErrors() {
        document.querySelector(".errorMsg").innerHTML = "";
}


/**************************** User Profile Retype Password ****************************/
$('.retype').hide();
$('#ChangePasswordBtn').click(function (e) {
        var ok = confirm('Do you want to change your password?');
        if (ok) {
                $(this).data('clicked', true);
                $(this).hide();
                $('.retype').show();
        } else {
                e.preventDefault();
        }
})

/**************************** User Profile Retype Password ****************************/
$('#userprofile')
        .each(function () {
                $(this).data('serialized', $(this).serialize())
        })
        .on('change input', function () {
                $(this)
                        .find('input:submit, button:submit')
                        .prop('disabled', $(this).serialize() == $(this).data('serialized'))
                        ;
        })
        .find('input:submit, button:submit')
        .prop('disabled', true);


/**************************** Post Item Validation ****************************/
$(function () {
        $(":file").change(function () {
                if (this.files && this.files[0]) {
                        var reader = new FileReader();
                        reader.onload = imageIsLoaded;
                        reader.readAsDataURL(this.files[0]);
                }
        });

        function imageIsLoaded(e) {
                $('#myImg').attr('src', e.target.result)
                        .height(200);
        };

        /*     function imageIsLoaded(e) {
 *              *             $('#myImg').attr('src', e.target.result)
 *                       *                         .width(auto)
 *                                *                                     .height(200);
 *                                         *                                         };  */

        $('.date-own').datepicker({
                format: "yyyy",
                viewMode: "years",
                minViewMode: "years",
                endDate: '+0d',
                autoclose: true,
        });

        $('#itemform').submit(function () {
                $('.errorMsg').text('');
                var category = $('#categoryselect').val();
                var title = $('#name').val();
                var description = $('#description').val();
                var img = $('#photoURL').val();
                var purchasedYear = $('#purchasedYear').val();
                var purchasedPrice = $('#purchasedPrice').val();
                var depositPrice = $('#depositPrice').val();
                var rentPerDay = $('#rentPerDay').val();
                var itemStartDate = $('#itemStartDate').val();
                var itemFinishDate = $('#itemFinishDate').val();

                var postalcode = $('#postalcode').val();

                var valid = true;

                if (!category) {
                        $('#categoryError').text('Please select the product category.');
                        valid = false;
                }
                if (!title) {
                        $('#nameError').text('Please enter the product title.');
                        valid = false;
                }
                if (!description) {
                        $('#descError').text('Please enter the description for the product.');
                        valid = false;
                }
                if (!img) {
                        $('#imgError').text('Please upload the product image.');
                        valid = false;
                }
                if (!purchasedYear) {
                        $('#purchasedYearError').text('Please enter the product purchased year.');
                        valid = false;
                } else if (purchasedYear.length != 4) {
                        $('#purchasedYearError').text('Purchased year must be 4 digits.');
                        valid = false;
                } else if (isNaN(purchasedYear)) {
                        $('#purchasedYearError').text('Purchased year must be numbers.');
                        valid = false;
                }
                if (!purchasedPrice) {
                        $('#purchasedPriceError').text('Please enter the product purchased price.');
                        valid = false;
                } else if (purchasedPrice < 0.99) {
                        $('#purchasedPriceError').text('Purchased price must be positive value.');
                        valid = false;
                } else if (purchasedPrice > 10000.00) {
                        $('#purchasedPriceError').text('Purchased price must be maximum $10000.00.');
                        valid = false;
                }
                if (!depositPrice) {
                        $('#depositError').text('Please enter the product deposit price.');
                        valid = false;
                } else if (depositPrice < 0.99) {
                        $('#depositError').text('Deposit price must be positive value.');
                        valid = false;
                } else if (depositPrice > 10000) {
                        $('#depositError').text('Deposit price must be maximum $10000.00.');
                        valid = false;
                }
                if (!rentPerDay) {
                        $('#rentError').text('Please enter the product rental price per day.');
                        valid = false;
                } else if (rentPerDay < 0.99) {
                        $('#rentError').text('Rental price must be positive value.');
                        valid = false;
                } else if (rentPerDay > 500) {
                        $('#rentError').text('Rental price must be maximum $500.00.');
                        valid = false;
                }
                if (!itemStartDate) {
                        $('#itemStartDateError').text('Please enter the rental period start date.');
                        valid = false;
                }
                if (!itemFinishDate) {
                        $('#itemFinishDateError').text('Please enter the rental period end date.');
                        valid = false;
                }
                return valid;
        })
});

String.prototype.hashCode = function () {
        var hash = 0, i, chr;
        if (this.length === 0) return hash;
        for (i = 0; i < this.length; i++) {
                chr = this.charCodeAt(i);
                hash = ((hash << 5) - hash) + chr;
                hash |= 0; // Convert to 32bit integer
        }
        return hash;
}


/**************************** Item Listing Page - display range value ****************************/

function displayDeposit(val) {
        document.getElementById("depositVal").innerHTML = val;
}

function displayDailyRate(val) {
        document.getElementById("dailyRateVal").innerHTML = val;
}