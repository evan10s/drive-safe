import { Controller } from "stimulus"

export default class extends Controller {
    static targets = ["name"];

    connect() {
        console.log("Hello, Stimulus!", this.element);
    }

    get name() {
        return this.nameTarget.value;
    }
}
