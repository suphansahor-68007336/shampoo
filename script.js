/* ==========================================================================
   DAYDREAM HAIR — Shared Application Script
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. หน้า product.html
  if (document.getElementById('product-list')) {
    initProductPage();
  }

  // 2. หน้า order.html
  if (document.getElementById('orderForm')) {
    initOrderPage();
  }

  // 3. หน้า admin.html
  if (document.querySelector('#ordersTable tbody')) {
    initAdminPage();
  }
});

/* ==========================================================================
   1. PRODUCT PAGE (product.html)
   Elements: #filter-bar, #product-list
   ========================================================================== */

let allProducts = [];

async function initProductPage() {
  const filterBar = document.getElementById('filter-bar');
  const productContainer = document.getElementById('product-list');

  // สร้างปุ่มกรองตาม mood ลงใน #filter-bar อัตโนมัติ (หรือผูกกับปุ่มที่มีอยู่แล้ว)
  const moods = [
    { key: 'all', label: 'ทั้งหมด' },
    { key: 'fresh', label: 'Fresh' },
    { key: 'sweet', label: 'Sweet' },
    { key: 'confident', label: 'Confident' },
    { key: 'romance', label: 'Romance' }
  ];

  if (filterBar && filterBar.children.length === 0) {
    filterBar.innerHTML = moods
      .map(
        (m) =>
          `<button type="button" class="btn btn-sm" data-mood="${m.key}">${m.label}</button>`
      )
      .join('');
  }

  try {
    const response = await fetch('products.json');
    if (!response.ok) throw new Error('ไม่สามารถโหลดไฟล์ products.json ได้');
    allProducts = await response.json();

    // อ่าน URL parameter ?mood=xxx
    const urlParams = new URLSearchParams(window.location.search);
    const initialMood = (urlParams.get('mood') || 'all').toLowerCase();

    // กรองและแสดงสินค้าทันทีที่โหลดหน้า
    filterAndRenderProducts(initialMood);
    updateActiveFilterButton(initialMood);

    // ผูก event คลิกปุ่มกรองใน #filter-bar
    if (filterBar) {
      filterBar.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-mood]');
        if (!btn) return;
        const selectedMood = btn.getAttribute('data-mood').toLowerCase();
        filterAndRenderProducts(selectedMood);
        updateActiveFilterButton(selectedMood);
      });
    }
  } catch (error) {
    console.error(error);
    productContainer.innerHTML = `<p style="text-align:center; grid-column: 1 / -1;">ไม่สามารถโหลดข้อมูลสินค้าได้ในขณะนี้</p>`;
  }
}

function updateActiveFilterButton(activeMood) {
  const filterButtons = document.querySelectorAll('#filter-bar [data-mood]');
  filterButtons.forEach((btn) => {
    const btnMood = btn.getAttribute('data-mood').toLowerCase();
    if (btnMood === activeMood) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function filterAndRenderProducts(mood) {
  const productContainer = document.getElementById('product-list');
  const filtered =
    mood === 'all'
      ? allProducts
      : allProducts.filter((item) => item.mood.toLowerCase() === mood);

  if (filtered.length === 0) {
    productContainer.innerHTML = `<p style="text-align:center; grid-column: 1 / -1;">ไม่พบสินค้าในหมวดหมู่นี้</p>`;
    return;
  }

  productContainer.innerHTML = filtered
    .map((product) => {
      const moodKey = product.mood.toLowerCase();
      const moodLabel = moodKey.charAt(0).toUpperCase() + moodKey.slice(1);
      const itemFullName = `${product.name} ${product.size}`;
      const orderUrl = `order.html?item=${encodeURIComponent(itemFullName)}&price=${encodeURIComponent(product.price)}`;

      return `
        <article class="product-card mood-${moodKey}">
          <div class="product-image-wrap">
            <img src="${product.image}" alt="${product.name}" loading="lazy">
          </div>
          <div class="product-meta">
            <span class="mood-tag">
              <span class="mood-dot"></span>
              ${moodLabel}
            </span>
            <span class="product-size">${product.size}</span>
          </div>
          <h3 class="product-title">${product.name}</h3>
          <p class="product-desc">${product.description || ''}</p>
          <div class="product-footer">
            <span class="product-price">${Number(product.price).toLocaleString()} บาท</span>
            <a href="${orderUrl}" class="btn btn-sm btn-accent">สั่งซื้อ</a>
          </div>
        </article>
      `;
    })
    .join('');
}

/* ==========================================================================
   2. ORDER PAGE (order.html)
   Elements: #orderForm, #customerName, #contact, #items, #total, #note
   ========================================================================== */

function initOrderPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const itemParam = urlParams.get('item');
  const priceParam = urlParams.get('price');

  const itemsInput = document.getElementById('items');
  const totalInput = document.getElementById('total');

  // เติมชื่อสินค้าลง id="items" และราคาลง id="total" อัตโนมัติทันทีที่โหลดหน้า
  if (itemsInput && itemParam !== null) {
    itemsInput.value = itemParam;
  }
  if (totalInput && priceParam !== null) {
    totalInput.value = priceParam;
  }

  const orderForm = document.getElementById('orderForm');
  orderForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const submitBtn = orderForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'กำลังส่งคำสั่งซื้อ...';
    }

    const payload = {
      customerName: document.getElementById('customerName').value.trim(),
      contact: document.getElementById('contact').value.trim(),
      items: document.getElementById('items').value.trim(),
      total: document.getElementById('total').value.trim(),
      note: document.getElementById('note').value.trim()
    };

    fetch('https://script.google.com/macros/s/AKfycbwIFpbTM41Bdnvtdzgdeppe8DDDDPxcOzYwqXsxsGQEiReRjlOEwaHGxNCqKkbdH5nB4g/exec', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
      .then(() => {
        window.location.href = 'thankyou.html';
      })
      .catch((error) => {
        console.error(error);
        alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'ยืนยันสั่งซื้อ';
        }
      });
  });
}

/* ==========================================================================
   3. ADMIN PAGE (admin.html)
   Element: #ordersTable tbody
   ========================================================================== */

async function initAdminPage() {
  const tableBody = document.querySelector('#ordersTable tbody');
  const csvUrl =
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3aTFOhixrpNazS4CQr5rRQb1YC4eR2ZstvVlU-MR7kAZ5XnkImWHg9JTY-3nzwj6R80IWuN19UKoQ/pub?gid=0&single=true&output=csv';

  try {
    const response = await fetch(`${csvUrl}&t=${Date.now()}`);
    if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูล CSV ได้');

    const csvText = await response.text();
    const rows = parseCSV(csvText);

    // ตัดแถวหัวตาราง (index 0) และกรองแถวว่างออก
    const dataRows = rows.slice(1).filter((row) => row.some((cell) => cell.trim() !== ''));

    // เรียงจากรายการล่าสุดขึ้นก่อน
    dataRows.reverse();

    if (dataRows.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">ยังไม่มีรายการสั่งซื้อ</td></tr>`;
      return;
    }

    tableBody.innerHTML = dataRows
      .map((row) => {
        const timestamp = formatTimestamp(row[0] || '');
        const customerName = escapeHTML(row[1] || '-');
        const contact = escapeHTML(row[2] || '-');
        const items = escapeHTML(row[3] || '-');
        const total = row[4] ? `${Number(row[4]).toLocaleString()} บาท` : '-';
        const note = escapeHTML(row[5] || '-');

        return `
          <tr>
            <td>${escapeHTML(timestamp)}</td>
            <td>${customerName}</td>
            <td>${contact}</td>
            <td>${items}</td>
            <td>${total}</td>
            <td>${note}</td>
          </tr>
        `;
      })
      .join('');
  } catch (error) {
    console.error(error);
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">เกิดข้อผิดพลาดในการโหลดข้อมูลคำสั่งซื้อ</td></tr>`;
  }
}

/**
 * ฟังก์ชัน Parse CSV ด้วยตัวเอง (ไม่ใช้ library ภายนอก)
 */
function parseCSV(csvText) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField);
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}

function formatTimestamp(rawDate) {
  if (!rawDate) return '-';
  const parsed = new Date(rawDate);
  if (isNaN(parsed.getTime())) return rawDate;
  return parsed.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}