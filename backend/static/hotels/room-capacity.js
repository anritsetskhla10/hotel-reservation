(() => {
  const typeSelector = 'select[data-fixed-capacities]'

  // შესაბამისი ტევადობის ველის განახლება
  function updateCapacity(type, changed = false) {
    const capacityName = type.name.replace(/room_type$/, 'capacity')
    const capacity = type.form?.elements.namedItem(capacityName)
    if (!(capacity instanceof HTMLInputElement)) return

    // ფორმიდან მიღებული ტევადობის წესები
    const fixed = JSON.parse(type.dataset.fixedCapacities)
    const defaults = JSON.parse(type.dataset.defaultCapacities)
    const isFixed = Object.hasOwn(fixed, type.value)
    const hasDifferentValue =
      capacity.value !== '' && Number(capacity.value) !== fixed[type.value]

    // ფიქსირებული ტევადობის რედაქტირების შეზღუდვა
    capacity.readOnly = isFixed && (changed || !hasDifferentValue)
    capacity.required = type.value === 'other' && type.name === 'room_type'

    if (capacity.readOnly) {
      capacity.value = fixed[type.value]
    } else if (changed || capacity.value === '') {
      capacity.value = defaults[type.value] ?? ''
    }
  }

  // გვერდზე არსებული ნომრების ფორმების მომზადება
  function initialize() {
    document.querySelectorAll(typeSelector).forEach((type) => updateCapacity(type))
  }

  // გაშვება გვერდის ჩატვირთვის შემდეგ
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize)
  } else {
    initialize()
  }

  // ტიპის ცვლილებაზე ტევადობის განახლება
  document.addEventListener('change', (event) => {
    if (event.target.matches?.(typeSelector)) {
      updateCapacity(event.target, true)
    }
  })
})()
