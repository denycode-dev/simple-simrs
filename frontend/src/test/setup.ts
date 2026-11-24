// Test setup for jsdom environment
if (typeof HTMLDialogElement !== 'undefined') {
  HTMLDialogElement.prototype.show = HTMLDialogElement.prototype.show || function (this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.showModal = HTMLDialogElement.prototype.showModal || function (this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = HTMLDialogElement.prototype.close || function (this: HTMLDialogElement) {
    this.open = false;
  };
}
