/* --------------------------------------------------------------------------
   고려티켓 (KU Ticket) - 애플리케이션 로직 (app.js)
   상태 관리, 화면 라우팅, 실시간 DB/SQL 로그 생성 및 인터랙티브 좌석 예매
-------------------------------------------------------------------------- */

// ==========================================
// 1. 초기 모의 데이터 및 상태 정의
// ==========================================

// 초기 콘서트 목록
const INITIAL_CONCERTS = [
  {
    id: 1,
    title: "아이유 단독 콘서트 - The Golden Hour",
    singer: "아이유 (IU)",
    genre: "pop",
    date: "2026-09-18",
    time: "19:30",
    location: "서울 잠실올림픽주경기장",
    desc: "아이유의 데뷔 기념일에 개최되는 특별 단독 콘서트. 황홀한 오렌지 태양 아래 아름다운 음악의 선율과 웅장한 오케스트라 세션이 어우러지는 전설적인 무대에 여러분을 초대합니다.",
    vipPrice: 150000,
    sPrice: 120000,
    standingPrice: 90000,
    totalSeats: 100,
    posterBg: "linear-gradient(135deg, #4b1248 0%, #f0c27b 100%)" // 그라데이션으로 포스터 아트웍 표현
  },
  {
    id: 2,
    title: "BTS 월드 투어 - Yet To Come in KU",
    singer: "방탄소년단 (BTS)",
    genre: "k-pop",
    date: "2026-10-05",
    time: "18:00",
    location: "고려대학교 녹지운동장 특설무대",
    desc: "전 세계를 매료시킨 글로벌 아티스트 BTS가 고려대학교를 찾아옵니다. 화려한 퍼포먼스와 심장을 울리는 라이브 무대로 하나가 되는 짜릿한 축제의 밤을 함께 하세요.",
    vipPrice: 150000,
    sPrice: 120000,
    standingPrice: 90000,
    totalSeats: 100,
    posterBg: "linear-gradient(135deg, #1f1c2c 0%, #928dab 100%)"
  },
  {
    id: 3,
    title: "검정치마 단독 공연 - TEEN TROUBLES",
    singer: "검정치마 (The Black Skirts)",
    genre: "indie",
    date: "2026-09-30",
    time: "20:00",
    location: "서울 마포구 예스24 라이브홀",
    desc: "특유의 감성적인 멜로디와 날 것의 가사로 청춘들의 밤을 노래하는 검정치마의 단독 콘서트. 몽환적인 밴드 사운드와 함께 깊어가는 가을 밤을 빈티지한 감성으로 물들입니다.",
    vipPrice: 150000,
    sPrice: 120000,
    standingPrice: 90000,
    totalSeats: 100,
    posterBg: "linear-gradient(135deg, #e55d87 0%, #5fc3e4 100%)"
  },
  {
    id: 4,
    title: "NewJeans 팬미팅 - Bunnies Camp 2026",
    singer: "뉴진스 (NewJeans)",
    genre: "k-pop",
    date: "2026-11-12",
    time: "17:00",
    location: "서울 고척스카이돔",
    desc: "버니즈와 뉴진스가 함께 떠나는 특별한 캠핑! 청량하고 트렌디한 Y2K 감성이 물씬 풍기는 신곡 무대들과 다채로운 팬 참여 이벤트를 통해 잊지 못할 추억을 선사합니다.",
    vipPrice: 150000,
    sPrice: 120000,
    standingPrice: 90000,
    totalSeats: 100,
    posterBg: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"
  }
];

// 초기 예매 완료된 좌석 데이터 생성 (각 콘서트별로 일부 좌석을 무작위로 채워두어 리얼리티 부여)
function initSeatReservations() {
  const reservations = {};
  INITIAL_CONCERTS.forEach(concert => {
    const reservedList = [];
    // 무작위로 30~50% 좌석 예매 완료 처리
    const randomCount = Math.floor(Math.random() * 20) + 35;
    while (reservedList.length < randomCount) {
      const row = String.fromCharCode(65 + Math.floor(Math.random() * 10)); // A ~ J
      const num = Math.floor(Math.random() * 10) + 1; // 1 ~ 10
      const seatId = `${row}-${num}`;
      if (!reservedList.includes(seatId)) {
        reservedList.push(seatId);
      }
    }
    reservations[concert.id] = reservedList;
  });
  return reservations;
}

// 애플리케이션 전역 상태 관리
const AppState = {
  currentUser: null,           // 현재 로그인한 사용자 객체
  currentView: "home",         // 현재 활성화된 화면 (home, auth, detail, seats, mytickets)
  concerts: INITIAL_CONCERTS,  // 콘서트 목록
  selectedConcert: null,       // 현재 상세조회/예매 중인 콘서트
  selectedSeats: [],           // 사용자가 현재 선택 중인 좌석 목록
  appliedCoupon: null,         // 적용된 할인 쿠폰 객체
  
  // 로컬스토리지 연결 및 로드
  loadFromStorage() {
    // 사용자 DB 불러오기
    if (!localStorage.getItem("db_users")) {
      // 기본 관리자 및 모의 테스트 계정 생성
      const defaultUsers = [
        { id: "jiokim", name: "김지오", email: "jiokim@korea.ac.kr", password: "password123" }
      ];
      localStorage.setItem("db_users", JSON.stringify(defaultUsers));
    }
    
    // 예약 좌석 로드
    if (!localStorage.getItem("db_seat_status")) {
      const initialStatus = initSeatReservations();
      localStorage.setItem("db_seat_status", JSON.stringify(initialStatus));
    }

    // 사용자 결제 예매 내역 로드
    if (!localStorage.getItem("db_bookings")) {
      localStorage.setItem("db_bookings", JSON.stringify([]));
    }
  },

  getUsers() {
    return JSON.parse(localStorage.getItem("db_users"));
  },

  saveUser(newUser) {
    const users = this.getUsers();
    users.push(newUser);
    localStorage.setItem("db_users", JSON.stringify(users));
  },

  getReservedSeats(concertId) {
    const db = JSON.parse(localStorage.getItem("db_seat_status"));
    return db[concertId] || [];
  },

  reserveSeats(concertId, seatsList) {
    const db = JSON.parse(localStorage.getItem("db_seat_status"));
    if (!db[concertId]) db[concertId] = [];
    db[concertId] = [...db[concertId], ...seatsList];
    localStorage.setItem("db_seat_status", JSON.stringify(db));
  },

  releaseSeats(concertId, seatsList) {
    const db = JSON.parse(localStorage.getItem("db_seat_status"));
    if (db[concertId]) {
      db[concertId] = db[concertId].filter(seat => !seatsList.includes(seat));
    }
    localStorage.setItem("db_seat_status", JSON.stringify(db));
  },

  getBookings() {
    return JSON.parse(localStorage.getItem("db_bookings"));
  },

  saveBooking(booking) {
    const bookings = this.getBookings();
    bookings.push(booking);
    localStorage.setItem("db_bookings", JSON.stringify(bookings));
  },

  updateBookingStatus(bookingId, status) {
    const bookings = this.getBookings();
    const idx = bookings.findIndex(b => b.id === bookingId);
    if (idx !== -1) {
      bookings[idx].status = status;
      localStorage.setItem("db_bookings", JSON.stringify(bookings));
      return bookings[idx];
    }
    return null;
  }
};

// ==========================================
// 2. 가상 데이터베이스 및 시스템 로그 시뮬레이터
// ==========================================
const dbLogList = document.getElementById("db-log-list");
const dbConsole = document.getElementById("db-console");

function logDB(type, message) {
  const entry = document.createElement("div");
  entry.className = "console-log-entry";
  
  const timestamp = new Date().toLocaleTimeString("ko-KR", { hour12: false });
  let prefix = "";
  let typeClass = "";

  switch (type) {
    case "sql":
      prefix = `[SQL - ${timestamp}] `;
      typeClass = "log-query";
      break;
    case "python":
      prefix = `[PYTHON - ${timestamp}] `;
      typeClass = "log-python";
      break;
    case "success":
      prefix = `[SUCCESS - ${timestamp}] `;
      typeClass = "log-success";
      break;
    case "error":
      prefix = `[ERROR - ${timestamp}] `;
      typeClass = "log-error";
      break;
    default:
      prefix = `[SYSTEM - ${timestamp}] `;
      typeClass = "log-sys";
  }

  entry.innerHTML = `<span class="${typeClass}">${prefix}${escapeHtml(message)}</span>`;
  dbLogList.appendChild(entry);
  
  // 새 로그가 쌓이면 스크롤 아래로 내리기
  const consoleBody = document.getElementById("db-console-body");
  consoleBody.scrollTop = consoleBody.scrollHeight;

  // 최소화되어 있다면 살짝 불빛을 주어 유도
  if (dbConsole.classList.contains("minimized")) {
    const indicator = dbConsole.querySelector(".status-indicator");
    indicator.style.animation = "pulseGlow 0.5s 3";
    setTimeout(() => {
      indicator.style.animation = "pulseGlow 2s infinite";
    }, 1500);
  }
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ==========================================
// 3. 알림 토스트 (Toast) 유틸리티
// ==========================================
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  
  let iconSvg = "";
  if (type === "success") {
    iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" width="20" height="20" stroke="var(--accent-mint)" stroke-width="2.5" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  } else {
    iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" width="20" height="20" stroke="var(--accent-pink)" stroke-width="2.5" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
  }

  toast.innerHTML = `
    ${iconSvg}
    <span class="toast-msg">${message}</span>
  `;

  container.appendChild(toast);

  // 3초 후 토스트 제거
  setTimeout(() => {
    toast.style.animation = "fadeOut 0.3s forwards";
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// ==========================================
// 4. 화면 제어 및 라우팅 (Single Page Routing)
// ==========================================
const views = {
  home: document.getElementById("view-home"),
  auth: document.getElementById("view-auth"),
  detail: document.getElementById("view-detail"),
  seats: document.getElementById("view-seats"),
  mytickets: document.getElementById("view-mytickets")
};

const navLinks = {
  home: document.getElementById("nav-home"),
  mytickets: document.getElementById("nav-mytickets"),
  auth: document.getElementById("nav-auth")
};

function navigateTo(viewName) {
  // 인증 여부 검증이 필요한 화면 처리
  if ((viewName === "seats" || viewName === "mytickets") && !AppState.currentUser) {
    showToast("로그인이 필요한 서비스입니다.", "error");
    navigateTo("auth");
    logDB("sys", `Access to '${viewName}' denied. Redirected to Login form.`);
    return;
  }

  AppState.currentView = viewName;
  logDB("python", `Router: rendering view '${viewName}'`);

  // 모든 뷰 숨기고 해당하는 뷰만 표시
  Object.keys(views).forEach(key => {
    if (key === viewName) {
      views[key].classList.remove("hidden");
    } else {
      views[key].classList.add("hidden");
    }
  });

  // 내비게이션 바 링크 활성화 클래스 조절
  Object.keys(navLinks).forEach(key => {
    if (key === viewName) {
      navLinks[key].classList.add("active");
    } else {
      navLinks[key].classList.remove("active");
    }
  });

  // 상단 스크롤 초기화
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // 뷰 전환에 따른 부가 로직 실행
  if (viewName === "home") {
    renderConcertList();
  } else if (viewName === "mytickets") {
    renderMyTickets();
  }
}

// ==========================================
// 5. 회원가입 & 로그인 (Authentication) 로직
// ==========================================
let authMode = "login"; // "login" 또는 "signup"
const tabLogin = document.getElementById("tab-login");
const tabSignup = document.getElementById("tab-signup");
const formLogin = document.getElementById("form-login");
const formSignup = document.getElementById("form-signup");
let isIdChecked = false; // ID 중복 체크 완료 여부

// 로그인 / 회원가입 탭 전환
tabLogin.addEventListener("click", () => {
  authMode = "login";
  tabLogin.classList.add("active");
  tabSignup.classList.remove("active");
  formLogin.classList.remove("hidden");
  formSignup.classList.add("hidden");
  logDB("sys", "Switched Auth Mode to LOGIN.");
});

tabSignup.addEventListener("click", () => {
  authMode = "signup";
  tabSignup.classList.add("active");
  tabLogin.classList.remove("active");
  formSignup.classList.remove("hidden");
  formLogin.classList.add("hidden");
  logDB("sys", "Switched Auth Mode to SIGNUP.");
});

// ID 중복 검사
const btnCheckDuplicate = document.getElementById("btn-check-duplicate");
const signupIdInput = document.getElementById("signup-id");
const idCheckStatus = document.getElementById("id-check-status");

btnCheckDuplicate.addEventListener("click", () => {
  const idValue = signupIdInput.value.trim();
  if (!idValue) {
    showToast("아이디를 입력해 주세요.", "error");
    return;
  }
  if (idValue.length < 4) {
    showToast("아이디는 4자 이상이어야 합니다.", "error");
    return;
  }

  logDB("sql", `SELECT COUNT(*) FROM users WHERE username = '${idValue}';`);
  
  const users = AppState.getUsers();
  const duplicate = users.find(u => u.id === idValue);

  if (duplicate) {
    idCheckStatus.textContent = "이미 등록된 아이디입니다.";
    idCheckStatus.className = "input-status error";
    isIdChecked = false;
    logDB("error", "Username already exists in User Database.");
  } else {
    idCheckStatus.textContent = "사용 가능한 아이디입니다.";
    idCheckStatus.className = "input-status success";
    isIdChecked = true;
    logDB("success", "Username is available. Validation success.");
  }
});

signupIdInput.addEventListener("input", () => {
  isIdChecked = false;
  idCheckStatus.textContent = "";
});

// 회원가입 전송
formSignup.addEventListener("submit", (e) => {
  e.preventDefault();
  
  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const username = signupIdInput.value.trim();
  const password = document.getElementById("signup-pw").value;

  if (!isIdChecked) {
    showToast("아이디 중복 검사를 먼저 완료해 주세요.", "error");
    return;
  }

  if (password.length < 6) {
    showToast("비밀번호는 6자 이상이어야 합니다.", "error");
    return;
  }

  // 가상 DB 저장
  const newUser = { id: username, name, email, password };
  AppState.saveUser(newUser);

  logDB("python", `user_controller.py: register_user(username='${username}', email='${email}')`);
  logDB("sql", `INSERT INTO users (id, name, email, password) VALUES ('${username}', '${name}', '${email}', '${password}');`);
  logDB("success", `User account '${username}' successfully created and committed.`);

  showToast("회원가입이 완료되었습니다! 로그인해 주세요.", "success");
  
  // 로그인 화면으로 강제 이동
  formSignup.reset();
  isIdChecked = false;
  tabLogin.click();
});

// 로그인 전송
formLogin.addEventListener("submit", (e) => {
  e.preventDefault();
  
  const idValue = document.getElementById("login-id").value.trim();
  const pwValue = document.getElementById("login-pw").value;

  logDB("sql", `SELECT * FROM users WHERE id = '${idValue}' AND password = '${pwValue}' LIMIT 1;`);

  const users = AppState.getUsers();
  const matchedUser = users.find(u => u.id === idValue && u.password === pwValue);

  if (matchedUser) {
    AppState.currentUser = matchedUser;
    logDB("success", `User '${idValue}' authenticated successfully. Session created.`);
    
    // UI 업데이트
    updateHeaderUserProfile();
    showToast(`${matchedUser.name}님, 환영합니다!`, "success");
    
    // 메인 화면으로 이동
    formLogin.reset();
    navigateTo("home");
  } else {
    logDB("error", `Authentication failed for user '${idValue}': incorrect credentials.`);
    showToast("아이디 또는 비밀번호가 올바르지 않습니다.", "error");
  }
});

// 헤더 유저 프로필 활성화
function updateHeaderUserProfile() {
  const profileArea = document.getElementById("header-user-profile");
  const authNavLink = document.getElementById("nav-auth");
  const myTicketsNavLink = document.getElementById("nav-mytickets");
  
  if (AppState.currentUser) {
    profileArea.classList.remove("hidden");
    authNavLink.classList.add("hidden");
    myTicketsNavLink.classList.remove("hidden");

    document.getElementById("user-display-name").textContent = AppState.currentUser.name;
    document.getElementById("user-avatar-initial").textContent = AppState.currentUser.name.charAt(0);
  } else {
    profileArea.classList.add("hidden");
    authNavLink.classList.remove("hidden");
    myTicketsNavLink.classList.add("hidden");
  }
}

// 로그아웃
document.getElementById("btn-logout").addEventListener("click", () => {
  logDB("python", `auth_controller.py: destroy_session(user_id='${AppState.currentUser.id}')`);
  AppState.currentUser = null;
  updateHeaderUserProfile();
  showToast("로그아웃되었습니다.");
  navigateTo("home");
});

// 계정 복구(ID/PW 찾기) 모달 제어
const btnForgot = document.getElementById("btn-forgot-credentials");
const modalForgot = document.getElementById("modal-forgot");
const btnCloseForgot = document.getElementById("btn-close-forgot");
const formForgot = document.getElementById("form-forgot");

btnForgot.addEventListener("click", () => {
  modalForgot.classList.remove("hidden");
  logDB("sys", "Open Password Recovery modal.");
});
btnCloseForgot.addEventListener("click", () => {
  modalForgot.classList.add("hidden");
});
formForgot.addEventListener("submit", (e) => {
  e.preventDefault();
  const emailVal = document.getElementById("forgot-email").value.trim();
  
  logDB("sql", `SELECT * FROM users WHERE email = '${emailVal}' LIMIT 1;`);
  
  const users = AppState.getUsers();
  const match = users.find(u => u.email === emailVal);
  
  if (match) {
    logDB("python", `smtp_service.py: send_recovery_email(to='${emailVal}', name='${match.name}')`);
    logDB("success", `Mock email dispatched. Recovery link: http://kuticket.korea.ac.kr/reset/${btoa(match.id)}`);
    showToast("가입하신 이메일로 복구 안내를 발송했습니다.", "success");
    modalForgot.classList.add("hidden");
    formForgot.reset();
  } else {
    logDB("error", `Recovery failed: No account registered under email '${emailVal}'.`);
    showToast("등록되지 않은 이메일 주소입니다.", "error");
  }
});

// ==========================================
// 6. 콘서트 목록 및 검색 기능 (Home & Search View)
// ==========================================
const searchInput = document.getElementById("search-concert");
const filterGenre = document.getElementById("filter-genre");
const filterSort = document.getElementById("filter-sort");
const concertListContainer = document.getElementById("concert-list-container");

function renderConcertList() {
  const query = searchInput.value.toLowerCase().trim();
  const genre = filterGenre.value;
  const sort = filterSort.value;

  // DB 쿼리 로그 기록 (실제 필터링 조건 시각화)
  logDB("sql", `SELECT * FROM concerts WHERE (title LIKE '%${query}%' OR singer LIKE '%${query}%')` + 
        (genre !== "all" ? ` AND genre = '${genre}'` : "") + `;`);

  // 필터링
  let filtered = AppState.concerts.filter(c => {
    const matchQuery = c.title.toLowerCase().includes(query) || 
                      c.singer.toLowerCase().includes(query) || 
                      c.location.toLowerCase().includes(query);
    const matchGenre = genre === "all" || c.genre === genre;
    return matchQuery && matchGenre;
  });

  // 정렬
  if (sort === "date") {
    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
  } else if (sort === "availability") {
    // 잔여 좌석이 많이 남은 순
    filtered.sort((a, b) => {
      const aAvail = a.totalSeats - AppState.getReservedSeats(a.id).length;
      const bAvail = b.totalSeats - AppState.getReservedSeats(b.id).length;
      return bAvail - aAvail;
    });
  } else {
    // 추천순 (기본 ID순)
    filtered.sort((a, b) => a.id - b.id);
  }

  // HTML 생성
  concertListContainer.innerHTML = "";
  if (filtered.length === 0) {
    concertListContainer.innerHTML = `<p class="empty-message large">검색 조건에 일치하는 콘서트가 존재하지 않습니다.</p>`;
    return;
  }

  filtered.forEach(c => {
    const reservedCount = AppState.getReservedSeats(c.id).length;
    const availableCount = c.totalSeats - reservedCount;
    const isSoldOut = availableCount === 0;

    const card = document.createElement("div");
    card.className = "concert-card";
    card.addEventListener("click", () => {
      showConcertDetail(c.id);
    });

    const isDanger = availableCount <= 20;

    card.innerHTML = `
      <div class="card-poster" style="background: ${c.posterBg}">
        <span class="card-genre-tag">${c.genre.toUpperCase()}</span>
        <div class="poster-fallback-text">${escapeHtml(c.title.split("-")[0])}</div>
      </div>
      <div class="card-info">
        <div>
          <h3 class="card-title">${escapeHtml(c.title)}</h3>
          <p class="card-singer">${escapeHtml(c.singer)}</p>
          <div class="card-meta">
            <div class="card-meta-item">
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>${c.date} ${c.time}</span>
            </div>
            <div class="card-meta-item">
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              <span>${escapeHtml(c.location.split(" ")[1] || c.location)}</span>
            </div>
          </div>
        </div>
        <div class="card-footer">
          <span class="seat-badge ${isDanger ? 'danger' : ''}">
            ${isSoldOut ? '매진' : `잔여 ${availableCount}석`}
          </span>
          <span class="card-price">${c.vipPrice.toLocaleString()}원 ~</span>
        </div>
      </div>
    `;
    concertListContainer.appendChild(card);
  });
}

// 실시간 검색 바인딩
searchInput.addEventListener("input", renderConcertList);
filterGenre.addEventListener("change", renderConcertList);
filterSort.addEventListener("change", renderConcertList);

// ==========================================
// 7. 공연 상세 페이지 조회 (Detail View)
// ==========================================
const btnBackToHome = document.getElementById("btn-back-to-home");
const btnGoToSeats = document.getElementById("btn-go-to-seats");

function showConcertDetail(concertId) {
  const concert = AppState.concerts.find(c => c.id === concertId);
  if (!concert) return;

  AppState.selectedConcert = concert;
  logDB("sql", `SELECT * FROM concerts WHERE id = ${concertId} LIMIT 1;`);
  
  // 데이터 반영
  document.getElementById("detail-poster").style.background = concert.posterBg;
  document.getElementById("detail-poster").innerHTML = `<div class="poster-fallback-text" style="font-size: 2.2rem;">${escapeHtml(concert.title)}</div>`;
  document.getElementById("detail-title").textContent = concert.title;
  document.getElementById("detail-singer").textContent = `가수: ${concert.singer}`;
  document.getElementById("detail-datetime").textContent = `${concert.date} (금) ${concert.time}`;
  document.getElementById("detail-location").textContent = concert.location;
  document.getElementById("detail-desc").textContent = concert.desc;

  // 장르 태그 및 등급 가격
  const genresContainer = document.getElementById("detail-genres");
  const reservedSeats = AppState.getReservedSeats(concertId);
  const remaining = concert.totalSeats - reservedSeats.length;

  genresContainer.innerHTML = `
    <span class="badge genre-badge">${concert.genre.toUpperCase()}</span>
    <span class="badge status-badge ticketable">${remaining > 0 ? '예매 가능' : '매진'}</span>
  `;

  // 예매현황 Progress Bar
  const percentage = Math.round((remaining / concert.totalSeats) * 100);
  document.getElementById("detail-seat-fraction").textContent = `${remaining} / ${concert.totalSeats} 좌석 남음`;
  
  const progressBar = document.getElementById("detail-seat-progress");
  progressBar.style.width = `${percentage}%`;
  
  // 남은 좌석에 따른 바 색상 제어
  if (percentage <= 20) {
    progressBar.style.background = "linear-gradient(to right, var(--accent-pink), #ff7675)";
  } else {
    progressBar.style.background = "linear-gradient(to right, var(--accent-purple), var(--accent-mint))";
  }

  navigateTo("detail");
}

btnBackToHome.addEventListener("click", () => {
  navigateTo("home");
});

btnGoToSeats.addEventListener("click", () => {
  navigateTo("seats");
  initSeatMap();
});

// ==========================================
// 8. 좌석 조회 및 예매 로직 (Seat Map View)
// ==========================================
const btnBackToDetail = document.getElementById("btn-back-to-detail");
const seatGridElement = document.getElementById("seat-grid-element");
const selectedSeatsList = document.getElementById("selected-seats-list");
const btnProceedToPayment = document.getElementById("btn-proceed-to-payment");

btnBackToDetail.addEventListener("click", () => {
  // 선택 좌석 초기화
  AppState.selectedSeats = [];
  AppState.appliedCoupon = null;
  document.getElementById("coupon-code").value = "";
  document.getElementById("coupon-status-msg").className = "coupon-status";
  document.getElementById("coupon-status-msg").textContent = "";
  navigateTo("detail");
});

// 좌석 배치도 동적 생성
function initSeatMap() {
  const concert = AppState.selectedConcert;
  if (!concert) return;

  logDB("sql", `SELECT seat_id FROM seat_status WHERE concert_id = ${concert.id} AND status = 'reserved';`);
  const reservedSeats = AppState.getReservedSeats(concert.id);

  seatGridElement.innerHTML = "";
  AppState.selectedSeats = []; // 선택 초기화
  updateSelectedSeatsUI();

  // 10행 10열 (A ~ J 행, 1 ~ 10 번)
  for (let i = 0; i < 10; i++) {
    const rowChar = String.fromCharCode(65 + i); // A, B, C, D, E, F, G, H, I, J
    
    // A-C: VIP, D-G: S, H-J: Standing
    let grade = "standing";
    if (i < 3) grade = "vip";
    else if (i < 7) grade = "s-class";

    for (let j = 1; j <= 10; j++) {
      const seatId = `${rowChar}-${j}`;
      const seatBtn = document.createElement("button");
      seatBtn.className = `seat-element ${grade}`;
      seatBtn.dataset.seatId = seatId;
      seatBtn.dataset.grade = grade;
      seatBtn.textContent = seatId;

      // 이미 점유된 좌석 처리
      if (reservedSeats.includes(seatId)) {
        seatBtn.classList.add("reserved");
        seatBtn.disabled = true;
      }

      // 좌석 클릭 이벤트
      seatBtn.addEventListener("click", () => {
        toggleSeatSelection(seatId, grade);
      });

      seatGridElement.appendChild(seatBtn);
    }
  }
  
  logDB("python", `seat_manager.py: load_layout(concert_id=${concert.id}, total_seats=100)`);
}

// 좌석 선택/해제 토글
function toggleSeatSelection(seatId, grade) {
  const index = AppState.selectedSeats.findIndex(s => s.id === seatId);

  if (index > -1) {
    // 이미 선택된 경우 제거
    AppState.selectedSeats.splice(index, 1);
    document.querySelector(`.seat-element[data-seat-id="${seatId}"]`).classList.remove("selected");
    logDB("sys", `Deselected seat: ${seatId}`);
  } else {
    // 1인 최대 4석 예매 제한 설정
    if (AppState.selectedSeats.length >= 4) {
      showToast("티켓은 1인당 최대 4석까지 예매 가능합니다.", "error");
      return;
    }
    
    // 추가 선택
    AppState.selectedSeats.push({ id: seatId, grade: grade });
    document.querySelector(`.seat-element[data-seat-id="${seatId}"]`).classList.add("selected");
    logDB("sys", `Selected seat: ${seatId} (${grade.toUpperCase()})`);
  }

  updateSelectedSeatsUI();
}

// 선택 좌석 리스트 및 가격 합산 실시간 갱신
function updateSelectedSeatsUI() {
  selectedSeatsList.innerHTML = "";
  
  if (AppState.selectedSeats.length === 0) {
    selectedSeatsList.innerHTML = `<p class="empty-message">배치도에서 원하시는 좌석을 클릭하여 선택해주세요.</p>`;
    btnProceedToPayment.disabled = true;
    updatePriceCalc(0);
    return;
  }

  btnProceedToPayment.disabled = false;

  let basePriceSum = 0;
  
  AppState.selectedSeats.forEach(seat => {
    // 개별 칩 생성
    const chip = document.createElement("span");
    chip.className = "selected-seat-chip";
    
    let gradeLabel = "스탠딩";
    let seatPrice = AppState.selectedConcert.standingPrice;

    if (seat.grade === "vip") {
      gradeLabel = "VIP석";
      seatPrice = AppState.selectedConcert.vipPrice;
    } else if (seat.grade === "s-class") {
      gradeLabel = "S석";
      seatPrice = AppState.selectedConcert.sPrice;
    }

    basePriceSum += seatPrice;

    chip.innerHTML = `
      ${seat.id} (${gradeLabel})
      <button class="btn-remove-seat" title="선택 취소">&times;</button>
    `;

    // 칩 삭제 버튼 이벤트 바인딩
    chip.querySelector(".btn-remove-seat").addEventListener("click", (e) => {
      e.stopPropagation();
      toggleSeatSelection(seat.id, seat.grade);
    });

    selectedSeatsList.appendChild(chip);
  });

  updatePriceCalc(basePriceSum);
}

// 쿠폰 적용 및 결제 금액 실시간 계산
const btnApplyCoupon = document.getElementById("btn-apply-coupon");
const couponCodeInput = document.getElementById("coupon-code");
const couponStatusMsg = document.getElementById("coupon-status-msg");
const discountRow = document.getElementById("discount-calc-row");

btnApplyCoupon.addEventListener("click", () => {
  const code = couponCodeInput.value.trim();
  if (AppState.selectedSeats.length === 0) {
    showToast("좌석을 먼저 선택해 주세요.", "error");
    return;
  }

  logDB("sql", `SELECT * FROM coupons WHERE code = '${code}' AND is_active = 1;`);

  // 고려대학교 영문학과 스페셜 쿠폰 검증
  if (code === "KU_ENGL_2026") {
    AppState.appliedCoupon = { code: "KU_ENGL_2026", rate: 0.1, name: "고려대학교 영문학과 특별 할인" };
    couponStatusMsg.textContent = "쿠폰이 성공적으로 적용되었습니다! (10% 할인)";
    couponStatusMsg.className = "coupon-status success";
    logDB("success", "Coupon Code 'KU_ENGL_2026' accepted. 10% discount applied.");
    
    // 다시 UI 갱신해서 금액 할인 반영
    updateSelectedSeatsUI();
  } else if (!code) {
    showToast("쿠폰 코드를 입력해 주세요.", "error");
  } else {
    AppState.appliedCoupon = null;
    couponStatusMsg.textContent = "유효하지 않은 쿠폰 코드입니다.";
    couponStatusMsg.className = "coupon-status error";
    logDB("error", "Coupon validation query returned empty result.");
    updateSelectedSeatsUI();
  }
});

function updatePriceCalc(basePrice) {
  const discountPriceEl = document.getElementById("calc-discount-price");
  const totalPriceEl = document.getElementById("calc-total-price");

  document.getElementById("calc-base-price").textContent = `${basePrice.toLocaleString()}원`;

  let discount = 0;
  if (AppState.appliedCoupon && basePrice > 0) {
    discount = Math.round(basePrice * AppState.appliedCoupon.rate);
    discountRow.classList.remove("hidden");
    discountPriceEl.textContent = `-${discount.toLocaleString()}원`;
  } else {
    discountRow.classList.add("hidden");
  }

  const finalTotal = basePrice - discount;
  totalPriceEl.textContent = `${finalTotal.toLocaleString()}원`;
  totalPriceEl.dataset.value = finalTotal; // 결제 팝업에서 꺼내쓰기 위함
}

// ==========================================
// 9. 결제 모달 및 예매 완료 처리 (Checkout Flow)
// ==========================================
const modalPayment = document.getElementById("modal-payment");
const btnClosePayment = document.getElementById("btn-close-payment");
const modalPayAmount = document.getElementById("modal-pay-amount");
const formPayment = document.getElementById("form-payment");
const paymentMethods = document.getElementsByName("payment-method");
const payInputCard = document.getElementById("payment-input-card");
const payInputAlternate = document.getElementById("payment-input-alternate");

btnProceedToPayment.addEventListener("click", () => {
  // 예매하려는 유저 로그인 체크
  if (!AppState.currentUser) {
    navigateTo("auth");
    return;
  }
  
  // 모달 데이터 입력
  const finalPrice = document.getElementById("calc-total-price").dataset.value;
  modalPayAmount.textContent = `${Number(finalPrice).toLocaleString()}원`;

  // 결제창 띄우기
  modalPayment.classList.remove("hidden");
  logDB("sys", "Opened Payment Gateway Modal.");
});

btnClosePayment.addEventListener("click", () => {
  modalPayment.classList.add("hidden");
});

// 결제 수단 선택에 따른 인풋 제어
paymentMethods.forEach(method => {
  method.addEventListener("change", (e) => {
    const val = e.target.value;
    
    // 라벨 active 클래스 부여
    document.querySelectorAll(".method-option").forEach(lbl => {
      if (lbl.dataset.method === val) {
        lbl.classList.add("active");
      } else {
        lbl.classList.remove("active");
      }
    });

    // 화면 폼 조절
    if (val === "card") {
      payInputCard.classList.remove("hidden");
      payInputAlternate.classList.add("hidden");
      // 카드는 필수입력
      document.getElementById("card-number").required = true;
      document.getElementById("card-expiry").required = true;
      document.getElementById("card-cvc").required = true;
    } else {
      payInputCard.classList.add("hidden");
      payInputAlternate.classList.remove("hidden");
      // 가상화면일땐 인풋 필수해제
      document.getElementById("card-number").required = false;
      document.getElementById("card-expiry").required = false;
      document.getElementById("card-cvc").required = false;
    }

    logDB("sys", `Selected payment method: ${val.toUpperCase()}`);
  });
});

// 실제 모의 승인 및 e-티켓 발급
formPayment.addEventListener("submit", (e) => {
  e.preventDefault();
  
  const spinner = document.getElementById("pay-spinner");
  const btnText = document.getElementById("pay-btn-text");
  const submitBtn = document.getElementById("btn-submit-payment");

  // 버튼 비활성화 및 스피너 로딩 처리
  submitBtn.disabled = true;
  spinner.classList.remove("hidden");
  btnText.textContent = "결제 승인 진행 중...";

  logDB("python", `payment_gateway.py: request_auth(amount=${modalPayAmount.textContent.replace(/[^0-9]/g, '')}, gateway='nicepay')`);

  setTimeout(() => {
    // 로깅
    logDB("success", "Payment approved by bank PG. Transaction ID: TXN_" + Math.floor(Math.random() * 100000000));
    
    // 예매 번호 생성 (KU-연도-무작위 문자열)
    const bookingId = `KU-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const selectedSeatsArray = AppState.selectedSeats.map(s => s.id);
    const finalPrice = document.getElementById("calc-total-price").dataset.value;

    const newBooking = {
      id: bookingId,
      userId: AppState.currentUser.id,
      concertId: AppState.selectedConcert.id,
      seats: selectedSeatsArray,
      amount: Number(finalPrice),
      date: new Date().toLocaleDateString("ko-KR"),
      status: "confirmed" // confirmed, cancelled
    };

    // 로컬 스토리지에 정보 영속 저장
    AppState.saveBooking(newBooking);
    AppState.reserveSeats(AppState.selectedConcert.id, selectedSeatsArray);

    logDB("sql", `INSERT INTO bookings (id, user_id, concert_id, seats, amount, status) VALUES ('${bookingId}', '${AppState.currentUser.id}', ${AppState.selectedConcert.id}, '${selectedSeatsArray.join(",")}', ${finalPrice}, 'confirmed');`);
    logDB("sql", `UPDATE seats SET status = 'reserved', reserved_by = '${AppState.currentUser.id}' WHERE concert_id = ${AppState.selectedConcert.id} AND seat_id IN (${selectedSeatsArray.map(s => `'${s}'`).join(",")});`);
    logDB("python", `ticket_generator.py: generate_e_ticket(booking_id='${bookingId}', user_email='${AppState.currentUser.email}')`);
    logDB("success", `QR code created. Ticket notification email sent to ${AppState.currentUser.email}.`);

    // 결제 완료 폼 복구 및 모달 닫기
    submitBtn.disabled = false;
    spinner.classList.add("hidden");
    btnText.textContent = "안전 결제 승인 요청";
    modalPayment.classList.add("hidden");
    formPayment.reset();

    // 변수 초기화
    AppState.selectedSeats = [];
    AppState.appliedCoupon = null;
    document.getElementById("coupon-code").value = "";
    document.getElementById("coupon-status-msg").className = "coupon-status";
    document.getElementById("coupon-status-msg").textContent = "";

    showToast("티켓 예매 및 발급이 완료되었습니다!", "success");
    navigateTo("mytickets");

  }, 1500); // 1.5초 결제 로딩 연출
});

// ==========================================
// 10. 나의 예매 내역 및 취소 관리 (My Page View)
// ==========================================
const ticketsListContainer = document.getElementById("tickets-list-container");

function renderMyTickets() {
  logDB("sql", `SELECT * FROM bookings WHERE user_id = '${AppState.currentUser.id}' ORDER BY id DESC;`);
  
  const bookings = AppState.getBookings().filter(b => b.userId === AppState.currentUser.id);

  ticketsListContainer.innerHTML = "";

  if (bookings.length === 0) {
    ticketsListContainer.innerHTML = `<p class="empty-message large">예매하신 티켓 정보가 존재하지 않습니다. 새로운 공연을 신청해보세요!</p>`;
    return;
  }

  bookings.forEach(b => {
    const concert = AppState.concerts.find(c => c.id === b.concertId);
    if (!concert) return;

    const isCancelled = b.status === "cancelled";
    const ticketCard = document.createElement("div");
    ticketCard.className = `ticket-card ${isCancelled ? 'cancelled' : ''}`;

    // 상태 라벨
    const statusLabel = isCancelled 
      ? `<span class="ticket-status-label cancelled">예매 취소 환불완료</span>` 
      : `<span class="ticket-status-label confirmed">예매 확정 (입장 가능)</span>`;

    // 취소 버튼 상태 제어
    const cancelBtn = isCancelled 
      ? `<button class="btn btn-secondary btn-cancel-ticket" disabled>취소 처리됨</button>` 
      : `<button class="btn btn-secondary btn-cancel-ticket" onclick="cancelBooking('${b.id}')">예매 취소</button>`;

    // QR코드 모의 탑재 (간단한 예쁜 티켓용 QR모양 SVG)
    const qrSvg = `
      <svg class="ticket-qr-placeholder" viewBox="0 0 100 100" fill="none" stroke="black" stroke-width="2">
        <!-- 바깥 테두리 및 큰 네모 포인트 -->
        <rect x="10" y="10" width="20" height="20" fill="black" />
        <rect x="15" y="15" width="10" height="10" fill="white" />
        <rect x="70" y="10" width="20" height="20" fill="black" />
        <rect x="75" y="15" width="10" height="10" fill="white" />
        <rect x="10" y="70" width="20" height="20" fill="black" />
        <rect x="15" y="75" width="10" height="10" fill="white" />
        <!-- 복잡한 모의 QR 패턴 라인 -->
        <path d="M 40 10 H 60 M 40 20 H 50 M 45 25 H 60 M 10 40 V 60 M 20 40 H 50 M 35 50 V 65 M 50 40 H 70 M 60 50 V 90 M 70 70 H 90 M 10 65 H 30 M 45 70 H 55 M 35 80 H 50" stroke-width="4" stroke-linecap="square"/>
      </svg>
    `;

    ticketCard.innerHTML = `
      <div class="ticket-card-left">
        <div class="ticket-poster-mini" style="background: ${concert.posterBg}">
          <div class="ticket-poster-mini-text">${escapeHtml(concert.title.split("-")[0])}</div>
        </div>
        <div class="ticket-details-info">
          ${statusLabel}
          <h3 class="ticket-show-title">${escapeHtml(concert.title)}</h3>
          <p class="ticket-show-singer">${escapeHtml(concert.singer)}</p>
          
          <div class="ticket-meta-grid">
            <div class="ticket-meta-box">
              <span class="ticket-meta-label">공연 일시</span>
              <span class="ticket-meta-value">${concert.date} ${concert.time}</span>
            </div>
            <div class="ticket-meta-box">
              <span class="ticket-meta-label">공연 장소</span>
              <span class="ticket-meta-value">${escapeHtml(concert.location.split(" ")[1] || concert.location)}</span>
            </div>
            <div class="ticket-meta-box">
              <span class="ticket-meta-label">선택 좌석</span>
              <span class="ticket-meta-value">${b.seats.join(", ")} (${b.seats.length}석)</span>
            </div>
            <div class="ticket-meta-box">
              <span class="ticket-meta-label">결제 금액</span>
              <span class="ticket-meta-value">${b.amount.toLocaleString()}원</span>
            </div>
          </div>
        </div>
      </div>
      <div class="ticket-card-right">
        <div class="ticket-qr-area">
          ${isCancelled ? '<span style="color: var(--text-muted); font-size: 0.8rem; font-weight:700;">CANCELLED</span>' : qrSvg}
        </div>
        <span class="ticket-no">${b.id}</span>
        ${cancelBtn}
      </div>
    `;

    ticketsListContainer.appendChild(ticketCard);
  });
}

// 예매 취소 로직 (글로벌 바인딩을 위해 윈도우 객체 주입 또는 직관적으로 연결)
window.cancelBooking = function(bookingId) {
  if (!confirm("정말로 예매를 취소하시겠습니까?\n취소 시 전액 환불 처리됩니다.")) return;

  const bookings = AppState.getBookings();
  const booking = bookings.find(b => b.id === bookingId);
  if (!booking) return;

  logDB("sys", `Cancellation requested for booking ID: ${bookingId}`);

  // 데이터베이스 갱신 (좌석 해제 및 상태 변경)
  const updated = AppState.updateBookingStatus(bookingId, "cancelled");
  AppState.releaseSeats(booking.concertId, booking.seats);

  logDB("sql", `UPDATE bookings SET status = 'cancelled' WHERE id = '${bookingId}';`);
  logDB("sql", `UPDATE seats SET status = 'available', reserved_by = NULL WHERE concert_id = ${booking.concertId} AND seat_id IN (${booking.seats.map(s => `'${s}'`).join(",")});`);
  logDB("python", `payment_gateway.py: request_refund(transaction_id='TXN_XXXX', amount=${booking.amount})`);
  logDB("success", `Refund completed for ${booking.amount.toLocaleString()}원. Booking status updated.`);

  showToast("예매가 성공적으로 취소되고 전액 환불되었습니다.", "success");
  
  // 마이페이지 새로고침
  renderMyTickets();
};

// ==========================================
// 11. DB 콘솔 드래그 및 토글 처리
// ==========================================
const btnConsoleToggle = document.getElementById("btn-console-toggle");
const consoleHeader = document.getElementById("db-console-header");

// 헤더 클릭 시 접기/펴기
consoleHeader.addEventListener("click", () => {
  dbConsole.classList.toggle("minimized");
  
  if (dbConsole.classList.contains("minimized")) {
    logDB("sys", "Database Console minimized.");
  } else {
    logDB("sys", "Database Console expanded.");
  }
});

// 헤더 내부 버튼은 버블링 방지
btnConsoleToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  dbConsole.classList.toggle("minimized");
});

// ==========================================
// 12. 전체 네비게이션 이벤트 바인딩 및 초기 구동
// ==========================================
document.getElementById("btn-logo").addEventListener("click", () => navigateTo("home"));
navLinks.home.addEventListener("click", () => navigateTo("home"));
navLinks.mytickets.addEventListener("click", () => navigateTo("mytickets"));
navLinks.auth.addEventListener("click", () => navigateTo("auth"));

// 초기화
window.addEventListener("DOMContentLoaded", () => {
  logDB("sys", "System initialized. Reading settings from window...");
  AppState.loadFromStorage();
  
  // URL 해시 및 초기 뷰 라우팅
  navigateTo("home");
  updateHeaderUserProfile();
});
