package session

import (
	"net/http"
	"time"

	"radioatelier/package/adapter/auth/accessToken"
	"radioatelier/package/adapter/db/model"
	"radioatelier/package/config"
)

func GenerateAndSetAuthToken(w http.ResponseWriter, user *model.User) error {
	token, err := accessToken.NewFromUser(user)
	if err != nil {
		return err
	}

	encoded, err := token.Encode()
	if err != nil {
		return err
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "jwt",
		Value:    encoded,
		MaxAge:   int(time.Minute.Seconds()) * 15,
		Secure:   config.Get().IsLive,
		HttpOnly: true,
		Domain:   config.Get().Host,
		Path:     "/",
		SameSite: http.SameSiteLaxMode,
	})

	return nil
}
