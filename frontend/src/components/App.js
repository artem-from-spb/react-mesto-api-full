import { useState, useEffect } from "react";
import Footer from "./Footer";
import Header from "./Header";
import ImagePopup from "./ImagePopup";
import Main from "./Main";
import PopupWithForm from "./PopupWithForm";
import { CurrentUserContext } from "../contexts/CurrentUserContext";
import { api } from "../utils/Api";
import EditProfilePopup from "./EditProfilePopup";
import EditAvatarPopup from "./EditAvatarPopup";
import AddPlacePopup from "./AddPlacePopup";

import Register from "./Register";
import { Route, Switch, useHistory, Redirect } from "react-router-dom";
import Login from "./Login";
import InfoTooltip from "./InfoTooltip";
import ProtectedRoute from "./ProtectedRoute";
import * as Auth from "../utils/Auth";

import ok from "../images/Union.png";
import error from "../images/Unionred.png";

function App() {
  //////////////////////////////////////////////////////////////////////////////////////////
  const history = useHistory();

  const [isEditAvatarPopupOpen, setIsEditAvatarPopupOpen] = useState(false);
  const [isEditProfilePopupOpen, setIsEditProfilePopupOpen] = useState(false);
  const [isAddPlacePopupOpen, setIsAddPlacePopupOpen] = useState(false);

  const [selectedCard, setSelectedCard] = useState({});
  const [currentUser, setCurrentUser] = useState({});

  const [cards, setCards] = useState([]);

  const [loggedIn, setLoggedIn] = useState(false);

  const [infoTooltipOpen, setInfoTooltipOpen] = useState(false);
  const [infoTooltipImage, setInfoTooltipImage] = useState(ok);

  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");

  function checkToken() {
    const token = localStorage.getItem("jwt");
    if (token) {
      Auth.checkData(token)
        .then((res) => {
          if (res) {
            setEmail(res.email);
            setLoggedIn(true);

            history.push("/");
          }
        })
        .catch((err) => alert(err));
    }
  }


  useEffect(() => {
    if (loggedIn) {
      api.updateToken();
      Promise.all([api.getUserInfo(), api.getInitialCards()])
        .then(([userData, cardsData]) => {
          setCurrentUser(userData);
          setCards(cardsData);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, [loggedIn, history]);

  
  useEffect(() => {
    checkToken();
  }, [history]);

  useEffect(() => {
    const close = (e) => {
      if(e.keyCode === 27){
        closeAllPopups();
      }
    }
    window.addEventListener('keydown', close)
  return () => window.removeEventListener('keydown', close)
},[])


  function handleEditAvatarClick() {
    setIsEditAvatarPopupOpen(true);
  }

  function handleEditProfileClick() {
    setIsEditProfilePopupOpen(true);
  }

  function handleAddPlaceClick() {
    setIsAddPlacePopupOpen(true);
  }

  function closeAllPopups() {
    setIsEditAvatarPopupOpen(false);
    setIsEditProfilePopupOpen(false);
    setIsAddPlacePopupOpen(false);
    setSelectedCard(false);
    setInfoTooltipOpen(false);
  }

  function handleCardClick(card) {
    setSelectedCard(card);
  }

  function handleCardLike(card) {
    // ?????????? ??????????????????, ???????? ???? ?????? ???????? ???? ???????? ????????????????
    const isLiked = card.likes.some((i) => i === currentUser._id);

    // ???????????????????? ???????????? ?? API ?? ???????????????? ?????????????????????? ???????????? ????????????????
    api
      .changeLikeCardStatus(card._id, !isLiked)
      .then((newCard) => {
        setCards((state) =>
          state.map((c) => (c._id === card._id ? newCard : c))
        );
      })
      .catch((err) => alert(err));
  }

  function handleCardDelete(id) {
    api
      .removeCard(id)
      .then(() => {
        setCards(cards.filter((card) => card._id !== id));
      })
      .catch((err) => alert(err));
  }

  function handleUpdateUser(user) {
    api
      .editProfileData(user)
      .then((res) => {
        setCurrentUser(res);
        closeAllPopups();
      })
      .catch((err) => alert(err));
  }

  function handleUpdateAvatar(src) {
    api
      .avatarPictureNew(src.avatar)
      .then((res) => {
        setCurrentUser(res);
        closeAllPopups();
      })
      .catch((err) => alert(err));
  }

  function handleAddPlaceSubmit(card) {
    api
      .addNewCard(card)
      .then((res) => {
        setCards([res, ...cards]);
        closeAllPopups();
      })
      .catch((err) => alert(err));
  }

  function handleRegister({ password, email }) {
    Auth.register(password, email)
      .then(() => {
        setInfoTooltipImage(ok);
        setMessage("???? ?????????????? ????????????????????????????????????!");
        setInfoTooltipOpen(true);
        history.push("/sign-in");
      })
      .catch(() => {
        setInfoTooltipImage(error);
        setMessage("??????-???? ?????????? ???? ??????! ???????????????????? ?????? ??????.");
        setInfoTooltipOpen(true);
      });
  }

  function handleLogin({ email, password }) {
    Auth.authorize(email, password)
      .then((res) => {
        if (res.token) {
          setLoggedIn(true);
          localStorage.setItem("jwt", res.token);
          checkToken();
          history.push("/");
        }
      })
      .catch(() => {
        setInfoTooltipImage(error);
        setMessage("??????-???? ?????????? ???? ??????! ???????????????????? ?????? ??????.");
        setInfoTooltipOpen(true);
      });
  }

  function handleLogOut() {
    setLoggedIn(false);
    localStorage.removeItem("jwt");
  }

  function handleMouseClickPopupClose() {
    
  const popup = document.querySelector('.infoTooltip');

    popup.addEventListener("mousedown", (evt) => {
      if (
        evt.target === evt.currentTarget ||
        evt.target.classList.contains("infoTooltip_opened")
      ) {
        setInfoTooltipOpen(false);
      }
    });
  }

  return (
    <CurrentUserContext.Provider value={currentUser}>
      <div>
        <Header email={email} onSignOut={handleLogOut} loggedIn={loggedIn} />

        <InfoTooltip
          isOpen={infoTooltipOpen}
          onClose={closeAllPopups}
          image={infoTooltipImage}
          message={message}
          onClick={handleMouseClickPopupClose}
        />

        <Switch>
          <Route exact path="/sign-up">
            <Register onRegister={handleRegister} />
          </Route>

          <Route exact path="/sign-in">
            <Login onLogin={handleLogin} />
          </Route>

          <ProtectedRoute
            onEditProfile={handleEditProfileClick}
            onAddPlace={handleAddPlaceClick}
            onEditAvatar={handleEditAvatarClick}
            onCardClick={handleCardClick}
            onCardLike={handleCardLike}
            onCardDelete={handleCardDelete}
            cards={cards}
            exact path="/"
            component={Main}
            loggedIn={loggedIn}
          />

          <Route path="*">
            {loggedIn ? <Redirect to="/" /> : <Redirect to="/sign-in" />}
          </Route>
        </Switch>

        <Footer />

        {/* ?????????? ???????????????????????????? ?????????? */}
        <EditProfilePopup
          isOpen={isEditProfilePopupOpen}
          onClose={closeAllPopups}
          onUpdateUser={handleUpdateUser}
        />

        {/* ?????????? ???????????????????? ???????????????? */}
        <AddPlacePopup
          isOpen={isAddPlacePopupOpen}
          onClose={closeAllPopups}
          onUpdateCards={handleAddPlaceSubmit}
        />

        <ImagePopup card={selectedCard} onClose={closeAllPopups} />

        {/* ?????????????????????? ???????????????? */}
        <PopupWithForm
          name="confirm"
          title="???? ???????????????"
          formName="null"
          btnText="????"
          isOpen={false}

        ></PopupWithForm>

        {/* ???????????????? ???????????? */}
        <EditAvatarPopup
          isOpen={isEditAvatarPopupOpen}
          onClose={closeAllPopups}
          onUpdateAvatar={handleUpdateAvatar}
        />
      </div>
    </CurrentUserContext.Provider>
  );
}

export default App;
