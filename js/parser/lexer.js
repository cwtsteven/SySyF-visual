define(function(require) {

  var Token = require('parser/token');

  class Lexer {
    constructor(input) {
      this._input = input;
      this._index = 0;
      this._token = undefined;
      this._nextToken();
    }

    /**
     * Return the next char of the input or '\0' if we've reached the end
     */
    _nextChar() {
      if (this._index >= this._input.length) {
        return '\0';
      }

      return this._input[this._index++];
    }

    /**
     * Set this._token based on the remaining of the input
     *
     * This method is meant to be private, it doesn't return a token, just sets
     * up the state for the helper functions.
     */
    _nextToken() {
      let c;
      do {
        c = this._nextChar();
      } while (/\s/.test(c));

      switch (c) {
        case 'λ':
        case '\\':
          this._token = new Token(Token.LAMBDA);
          break;

        case '.':
          this._token = new Token(Token.DOT);
          break;

        case ',':
          this._token = new Token(Token.COMMA, ',', 1);
          break;

        case ';':
          this._token = new Token(Token.SEQ);
          break;

        case '(':
          this._token = new Token(Token.LPAREN);
          break;

        case ')':
          this._token = new Token(Token.RPAREN);
          break;

        case '{':
          this._token = new Token(Token.CLPAREN);
          break;

        case '}':
          this._token = new Token(Token.CRPAREN);
          break;

        case '\0':
          this._token = new Token(Token.EOF);
          break;

        case '~':
          this._token = new Token(Token.NOT, '~');
          break;

        case '&':
          if (this._nextChar() == '&')
            this._token = new Token(Token.AND, '&&', 5);
          else {
            this._index--;
            this.fail();
          }
          break;

        case '|':
          var c2 = this._nextChar();
          if (c2 == '|')
            this._token = new Token(Token.OR, '||', 4);
          else {
            this._index--;
            this.fail();
          }
          break;

        case '+':
          this._token = new Token(Token.PLUS, '+', 12);
          break;

        case '-':
          this._token = new Token(Token.SUB, '-', 12);
          break;

        case '*':
          this._token = new Token(Token.MULT, '*', 13);
          break;

        case '/':
          this._token = new Token(Token.DIV, '/', 13);
          break;

        case '%':
          this._token = new Token(Token.MOD, '%', 13); 
          break;

        case '<':
          var nexttoken = this._nextChar(); 
          if (nexttoken == '=')
            this._token = new Token(Token.LTE, '<=', 10);
          else if (nexttoken == '>')
            this._token = new Token(Token.NEQ, '<>', 10);
          else {
            this._index--;
            this.fail();
          }
          break;

        case '=':
          this._token = new Token(Token.DEFINE);
          break;

        case '⊞':
          this._token = new Token(Token.VECPLUS, '⊞', 12);
          break;

        case '⊠':
          this._token = new Token(Token.VECMULT, '⊠', 13);
          break;

        case '⊡':
          this._token = new Token(Token.VECDOT, '⊡', 13);
          break;

        case 'F':
          this._token = new Token(Token.FUSE);
          break;

        case 'Λ':
          this._token = new Token(Token.BIGLAMBDA);
          break;

        case '[':
          this._token = new Token(Token.LSQPARAM);
          break;

        case ']':
          this._token = new Token(Token.RSQPARAM);
          break;

        default:
          // text for string
          if (/[a-z]|_|'/.test(c)) {
            let str = '';
            do {
              str += c;
              c = this._nextChar();

            } while (/[a-zA-Z]|'|_|[0-9]/.test(c));

            // put back the last char which is not part of the identifier
            this._index--;

            if (str == "let")
              this._token = new Token(Token.LET);
            else if (str == "in")
              this._token = new Token(Token.IN);
            else if (str == "rec") 
              this._token = new Token(Token.REC);
            else if (str == "true")
              this._token = new Token(Token.TRUE);
            else if (str == "false")
              this._token = new Token(Token.FALSE);
            else if (str == "if")
              this._token = new Token(Token.IF);
            else if (str == "then")
              this._token = new Token(Token.THEN);
            else if (str == "else")
              this._token = new Token(Token.ELSE);
            else if (str == "link")
              this._token = new Token(Token.LINK);
            else if (str == "assign")
              this._token = new Token(Token.ASSIGN);
            //else if (str == "to")
            //  this._token = new Token(Token.TO);
            else if (str == "step")
              this._token = new Token(Token.STEP);
            else if (str == "peek")
              this._token = new Token(Token.PEEK);
            else if (str == "deref")
              this._token = new Token(Token.DEREF);
            else if (str == "root")
              this._token = new Token(Token.ROOT);
            else if (str == "fuse")
              this._token = new Token(Token.FUSION);
            else if (str == "from")
              this._token = new Token(Token.FROM);
            else if (str == "pc")
              this._token = new Token(Token.PC);
            else if (str == "fold")
              this._token = new Token(Token.FOLD);
            else
              this._token = new Token(Token.LCID, str);
          } 
          // text for numbers
          else if (/[0-9]/.test(c)) {
            let str = '';
            do {
              str += c;
              c = this._nextChar();
            } while (/[0-9]/.test(c));

            if (c == '.') {
              do {
                str += c;
                c = this._nextChar();
              } while (/[0-9]/.test(c));
            }

            // put back the last char which is not part of the identifier
            this._index--;

            this._token = new Token(Token.INT, parseFloat(str));
          } 
          else {
            this.fail();
          }
      }
    }

    /**
     * Assert that the next token has the given type, return it, and skip to the
     * next token.
     */
    token(type) {
      if (!type) {
        return this._token.value;
      }

      const token = this._token;
      this.match(type);
      return token.value;
    }

    lookahead() {
      return this._token;
    }

    /**
     * Throw an unexpected token error - ideally this would print the source
     * location
     */
    fail() {
      throw new Error(`Unexpected token at offset ${this._index}`);
    }

    /**
     * Returns a boolean indicating whether the next token has the given type.
     */
    next(type) {
      return this._token.type == type;
    }

    /**
     * Assert that the next token has the given type and skip it.
     */
    match(type) {
      if (this.next(type)) {
        this._nextToken();
        return;
      }
      console.error(`${this._index}: Invalid token: Expected '${type}' found '${this._token.type}'`);
      throw new Error('Parse Error');
    }

    /**
     * Same as `next`, but skips the token if it matches the expected type.
     */
    skip(type) {
      if (this.next(type)) {
        this._nextToken();
        return true;
      }
      return false;
    }
  }

  return Lexer;
});
