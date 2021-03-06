export default function ({
  // <Number> duration of auto close flash message (in milliseconds)
  duration = 3000,
  // <Array> custom css classes for template
  css = null,
} = {}, bus) {
  return {
    render(createElement) {
      const children = [];
      Object.keys(this.storage).map((messageId) => {
        const { content, type, options } = this.storage[messageId];
        const subchildren = [
          createElement('div', {
            attrs: { class: 'flash__message-content' },
            domProps: { innerHTML: content },
          }),
        ];

        const iconTemplateSearchRegex = new RegExp(`iconFor${type}`, 'i');
        const iconTemplateSlotName = Object.keys(this.$slots).find(name => iconTemplateSearchRegex.test(name));

        if (iconTemplateSlotName) {
          const slot = this.$slots[iconTemplateSlotName];
          const icon = createElement('div', {
            attrs: { class: 'flash__icon' },
          }, slot);
          subchildren.unshift(icon);
        }

        if (!options.important) {
          subchildren.push(createElement('button', {
            attrs: {
              type: 'button',
              class: 'flash__close-button',
              'data-dismiss': 'alert',
              'aria-label': 'alertClose',
            },
            on: {
              click: (event) => {
                event.stopPropagation();
                event.preventDefault();
                this.destroyFlash(messageId);
              },
            },
          }, [
            createElement('span', {
              attrs: { 'aria-hidden': 'true' },
              domProps: { innerHTML: '&times;' },
            }),
          ]));
        }

        children.push(createElement('div', {
          class: `${this.cssClasses(messageId)} flash__message`,
          key: messageId,
          attrs: {
            role: 'alert',
            'aria-live': 'polite',
            'aria-atomic': 'true',
          },
          on: {
            mouseover: () => { this.onMouseOver(messageId); },
            mouseleave: () => { this.onMouseOut(messageId); },
          },
        }, subchildren));
        return false;
      });

      return createElement('div', {}, [
        createElement('transition-group', {
          attrs: {
            name: this.transitionName,
            tag: 'div',
          },
          class: this.outerClass,
        }, children),
      ]);
    },
    props: {
      transitionName: {
        type: String,
        default: 'flash-transition',
      },
      outerClass: {
        type: String,
        default: 'flash__wrapper',
      },
    },
    data() {
      return Object.assign({
        message: null,
        closed: false,
        _timeout: null,
      }, { duration, css });
    },
    computed: {
      storage() {
        return bus.storage;
      },
    },
    created() {
      this.initRouterListener();
    },
    methods: {
      cssClasses(id) {
        return this.getFlash(id).type;
      },
      getFlash(id) {
        return this.storage[id];
      },
      destroyFlash(id) {
        this.getFlash(id).destroy();
      },
      onMouseOver(id) {
        const flash = this.getFlash(id);
        if (typeof flash !== 'undefined') {
          flash.onStartInteract();
        }
      },
      onMouseOut(id) {
        const flash = this.getFlash(id);
        if (typeof flash !== 'undefined') {
          flash.onCompleteInteract();
        }
      },
      initRouterListener() {
        if (!this.$router) return;
        this.$router.afterEach(() => {
          Object.keys(this.storage).forEach(id => this.destroyFlash(id));
        });
      },
    },
  };
}
