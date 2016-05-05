"use strict";

function SpecialScroll(applyTo, relativeSpeed) {
    var _this = this;

    this.relativeSpeed = relativeSpeed;
    this.applyTo = applyTo;
    this.onscroll = function (scroll) {
        if (!window.mobilecheck()) {
            var newPos = scroll * -_this.relativeSpeed;
            _this.applyTo.style.transform = "translateY(" + newPos + "px)";
            _this.applyTo.style.webkitTransform = "translateY(" + newPos + "px)";
        }
    };
}